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
 */
(function () {
  var APP_DB_ENDPOINT = 'https://x-fav-gellery.com/api/analytics/lp-event';

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

  function mirror(eventName, gtagProps) {
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

    try {
      var body = JSON.stringify({
        event: eventName,
        anonId: anonId,
        occurredAt: new Date().toISOString(),
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
  }

  window.xfgLpTracking = { mirror: mirror };
})();
