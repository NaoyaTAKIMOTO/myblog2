/**
 * LP イベントを app DB (analytics_events) に mirror するヘルパー。
 * GA4 と並行で送信し、Claude が SQL で直接 LP→signup の funnel を query
 * できるようにする (rich/simple 両 LP で共有)。
 *
 * 詳細: x-fav-gellery docs/implementation-plans/lp-event-mirror-to-app-db.md
 *
 * 使い方:
 *   <script src="/js/xfg-lp-tracking.js"></script>
 *   ...
 *   const props = { variant_id, experiment_id, scene_id, ... };
 *   gtag('event', 'scene_view', props);
 *   window.xfgLpTracking?.mirror('scene_view', props);
 *
 * **HTML の <head> に下の stub を置くこと (2026-09-19)。** このファイルは defer なので、
 * ページ途中の inline script が先に mirror を呼ぶと window.xfgLpTracking が未定義で
 * event が黙って捨てられていた (rich の scene_view が 37% 欠落)。stub が呼び出しを
 * 発生時刻つきで溜め、このファイルが読み込まれた時点で流す:
 *   <script>window.xfgLpTracking=window.xfgLpTracking||{_q:[],mirror:function(e,p){this._q.push([e,p,new Date().toISOString()])}};</script>
 *
 * lp_heartbeat: 最初の scene_view から 3 / 10 秒間ページが見え続けたら 1 回ずつ送る。
 * X のアプリ内ブラウザは閉じても pagehide が飛ばないことがあり、着地の半分が
 * 「event 1 つ = 滞在不明」になっていたため、離脱側ではなく滞在側で測る。
 * 詳細: x-fav-gellery docs/implementation-plans/acquisition-lp-conversion-2026-09.md WS-6
 */
(function () {
  var APP_DB_ENDPOINT = 'https://x-fav-gellery.com/api/analytics/lp-event';
  var HEARTBEAT_SECONDS = [3, 10];

  // X (Twitter) ピクセルのコンバージョンイベント ID。**CTA (ストアへ送るボタン) の押下**を
  // 表す。広告の Objective は Website clicks のままで、まずは件数を観測するために入れる
  // (最適化対象に据えるかは件数を見てから判断する)。
  //
  // ⚠️ **金額 (value / currency) は渡さない。** 実際の課金はアプリ内課金で web からは
  // 観測できず、渡すと実在しない売上で入札が歪む。
  // ⚠️ イベント種別は購入ではなく「購入手前の意思表示」で作ってある。X の管理画面で
  // Purchase として数えないこと。
  //   → x-fav-gellery docs/implementation-plans/acquisition-lp-conversion-2026-09.md
  var X_PIXEL_CTA_EVENT_ID = 'tw-okhzr-rfhj1';

  // head の stub が溜めた呼び出し ([eventName, props, occurredAt])。
  var pending = (window.xfgLpTracking && window.xfgLpTracking._q) || [];

  function ensureAnonId() {
    try {
      var id = localStorage.getItem('xfg_lp_anon');
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('xfg_lp_anon', id);
      }
      return id;
    } catch (e) {
      return null;
    }
  }

  function mirror(eventName, gtagProps, occurredAt) {
    // **ピクセルは app DB 側の gate より前に撃つ。** localStorage が使えない端末では
    // anonId が null で以降を諦めるが、X 側の計測はそれとは独立に成立させたい。
    if (eventName === 'cta_click' && typeof window.twq === 'function') {
      try {
        window.twq('event', X_PIXEL_CTA_EVENT_ID, {});
      } catch (e) {
        // ピクセルが落ちていても LP の計測は続ける
      }
    }

    var anonId = ensureAnonId();
    if (!anonId) return;
    if (!gtagProps || !gtagProps.variant_id || !gtagProps.experiment_id) return;

    var props = {
      variant_id: gtagProps.variant_id,
      experiment_id: gtagProps.experiment_id,
      page_path: location.pathname,
    };
    if (gtagProps.scene_id !== undefined) props.scene_id = String(gtagProps.scene_id);
    if (gtagProps.exit_scene !== undefined) props.scene_id = String(gtagProps.exit_scene);
    if (gtagProps.scene_index !== undefined) props.scene_index = Number(gtagProps.scene_index);
    if (gtagProps.exit_scene_index !== undefined) props.scene_index = Number(gtagProps.exit_scene_index);
    if (gtagProps.milestone_pct !== undefined) props.scroll_depth = Number(gtagProps.milestone_pct);
    if (gtagProps.cta_label !== undefined) props.cta_location = String(gtagProps.cta_label);
    if (gtagProps.elapsed_s !== undefined) props.elapsed_s = Number(gtagProps.elapsed_s);

    try {
      var body = JSON.stringify({
        event: eventName,
        anonId: anonId,
        occurredAt: occurredAt || new Date().toISOString(),
        props: props,
      });
      // Content-Type は text/plain でなければならない。**application/json は CORS
      // safelisted ではないので preflight (OPTIONS) が必要になるが、sendBeacon は
      // preflight を送れない**ため、ブラウザがリクエストを黙って捨てる (エラーも出ない)。
      // これで 2026-07-13 の設置から source='lp' が 1 行も入らなかった。
      // 受け側 (/api/analytics/lp-event) は Content-Type を見ずに本文を JSON として
      // 読むので、text/plain のままで正しく解釈される。戻してはいけない。
      var blob = new Blob([body], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon(APP_DB_ENDPOINT, blob);
    } catch (e) {
      // 静かに諦める (GA4 側で計測されてれば良い)
    }

    if (eventName === 'scene_view') startHeartbeat(gtagProps, occurredAt);
  }

  // ── lp_heartbeat ──────────────────────────────────────────
  // 起点は最初の scene_view (= ヒーローが viewport に入った時刻)。途中で一度でも
  // 隠れたら以降は送らない (= 「見え続けた秒数」の下限だけを数える)。
  var heartbeatStarted = false;
  var wasHidden = document.visibilityState === 'hidden';
  var markHidden = function () { wasHidden = true; };
  window.addEventListener('pagehide', markHidden);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') markHidden();
  });

  function startHeartbeat(gtagProps, occurredAt) {
    if (heartbeatStarted) return;
    heartbeatStarted = true;
    var t0 = occurredAt ? Date.parse(occurredAt) : Date.now();
    var base = { variant_id: gtagProps.variant_id, experiment_id: gtagProps.experiment_id };
    HEARTBEAT_SECONDS.forEach(function (sec) {
      var delay = Math.max(0, t0 + sec * 1000 - Date.now());
      setTimeout(function () {
        if (wasHidden || document.visibilityState === 'hidden') return;
        mirror('lp_heartbeat', {
          variant_id: base.variant_id,
          experiment_id: base.experiment_id,
          elapsed_s: sec,
        });
      }, delay);
    });
  }

  window.xfgLpTracking = { mirror: mirror };

  // stub が溜めた分を発生時刻つきで流す。
  for (var i = 0; i < pending.length; i++) {
    mirror(pending[i][0], pending[i][1], pending[i][2]);
  }
})();
