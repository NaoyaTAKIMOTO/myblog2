/**
 * 2026-09 の creative x LP 2x2 A/B で使う LP 共通の計装。
 *
 * **両アームで同じファイルを読む。** 計装が非対称だとアーム比較が壊れるので、
 * HTML 側には「文言とテーマ」だけを置き、イベント送信はここに一本化する。
 *
 * 詳細: x-fav-gellery docs/implementation-plans/ad-ab-creative-lp-2026-09.md
 *
 * 使い方 (HTML 側):
 *   <script>window.XFG_LP_VARIANT = 'pain';</script>   // または 'gain'
 *   <script defer src="/js/xfg-lp-tracking.js"></script>
 *   <script defer src="/js/xfg-lp-ab2609.js"></script>
 *
 * セルの決まり方:
 *   variant_id     = window.XFG_LP_VARIANT        ← LP アーム (Edge Function が振り分け)
 *   experiment_id  = URL の utm_content           ← creative アーム (広告リンクが持ってくる)
 */
(function () {
  var VARIANT = window.XFG_LP_VARIANT;
  if (!VARIANT) return;

  var params = new URLSearchParams(location.search);

  // creative アーム。広告以外 (organic / 直打ち) から来ると空になるが、
  // **xfg-lp-tracking.js は experiment_id が空だと event を捨てる**ので
  // fallback を必ず入れる。判定では 'direct' を除外して読む。
  var CREATIVE = params.get('utm_content') || 'direct';

  var EXPERIMENT_PROPS = {
    experiment_id: CREATIVE,
    variant_id: VARIANT,
  };

  var mirror = function (eventName, props) {
    if (window.xfgLpTracking) window.xfgLpTracking.mirror(eventName, props);
    if (typeof gtag === 'function') gtag('event', eventName, props);
  };

  // ── CTA リンクへの UTM 引き継ぎ ──────────────────────────────
  // LP の CTA リンクは utm_content を **CTA 位置** (hero_top_ios 等) に使っている。
  // そのままだと /install/ios に着いた時点で creative ラベルが上書きされて消え、
  // サーバ側 (ios_install_redirect) を creative 別に割れなくなる。
  // → creative は utm_term に載せ替えて渡す。utm_campaign は流入時の値を優先する。
  var INCOMING_CAMPAIGN = params.get('utm_campaign');

  var forwardUtm = function () {
    var links = document.querySelectorAll('a[data-cta][href]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href.indexOf('http') !== 0) continue;
      try {
        var url = new URL(href);
        url.searchParams.set('utm_term', CREATIVE);
        if (INCOMING_CAMPAIGN) url.searchParams.set('utm_campaign', INCOMING_CAMPAIGN);
        links[i].setAttribute('href', url.toString());
      } catch (e) {
        // 壊れた href は触らない (CTA を殺すより計測を諦める)
      }
    }
  };

  // ── scene_view ────────────────────────────────────────────
  // 1 画面完結なので scene は s1 の 1 つだけ。index は 0 で固定する。
  // (rich LP は s1/s2/sHow/s3 の 4 つ。段数が違うので scene_index を
  //  そのまま比較しないこと)
  var SCENE_ID = 's1';
  var sceneSent = false;

  var sendSceneView = function () {
    if (sceneSent) return;
    sceneSent = true;
    mirror('scene_view', Object.assign({
      scene_id: SCENE_ID,
      scene_index: 0,
    }, EXPERIMENT_PROPS));
  };

  // ── lp_exit ───────────────────────────────────────────────
  // pagehide と visibilitychange の両方から呼ばれるので二重送信を止める。
  var exitSent = false;
  var sendLpExit = function () {
    if (exitSent) return;
    exitSent = true;
    mirror('lp_exit', Object.assign({
      exit_scene: SCENE_ID,
      exit_scene_index: 0,
      transport_type: 'beacon',
    }, EXPERIMENT_PROPS));
  };

  // ── cta_click ─────────────────────────────────────────────
  var onClick = function (ev) {
    var target = ev.target.closest ? ev.target.closest('[data-cta]') : null;
    if (!target) return;
    mirror('cta_click', Object.assign({
      cta_label: target.getAttribute('data-cta'),
      link_url: target.getAttribute('href') || '',
    }, EXPERIMENT_PROPS));
  };

  // ── iOS 出し分け ──────────────────────────────────────────
  // **既定 (HTML) は App Store CTA で、非 iOS のときだけ web CTA に差し替える。**
  // 広告流入の 94% が iOS なので、JS が落ちても多数派には正しいボタンが残る。
  // iOS の web 導線は未ログインだとログイン画面に落ちるため、iOS に web CTA を
  // 出してしまうのがいちばん高くつく壊れ方になる。
  //   → x-fav-gellery docs/implementation-plans/archive/ad-platform-cta-analysis-2026-07.md
  //
  // desktop では App Store CTA が一瞬見えてから web CTA に入れ替わるが、
  // desktop は流入の数 % なので、iOS 側の確実性と引き換えに受け入れる。
  var applyPlatformCta = function () {
    var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) return;
    var ios = document.getElementById('heroTopIos');
    var iosSub = document.getElementById('heroTopIosSub');
    var web = document.getElementById('heroTopWeb');
    var platformSub = document.getElementById('heroTopPlatformSub');
    var isAndroid = /Android/i.test(navigator.userAgent);
    if (platformSub) {
      platformSub.textContent = isAndroid
        ? 'いいねの取り込みにはPCのChrome拡張機能が必要です。Androidでは、取り込んだいいねをWeb版で閲覧できます。'
        : 'PCではChrome拡張機能を使って、Xのいいねを取り込みます。';
      platformSub.style.display = 'block';
    }
    if (ios) ios.style.display = 'none';
    if (iosSub) iosSub.style.display = 'none';
    if (web) {
      if (!isAndroid) {
        web.href = 'https://x-fav-gellery.com/install/cws?utm_source=subcul-science&utm_medium=lp&utm_campaign=x-fav-ab2609&utm_content=hero_top_install';
        web.textContent = 'Chrome拡張機能を入手';
        web.setAttribute('data-cta', 'hero_top_install');
      }
      web.style.display = 'inline-flex';
    }
  };

  var init = function () {
    // UTM の引き継ぎは **クリック計測より先**に済ませる。
    // cta_click の link_url を、実際に飛ぶ URL と一致させるため。
    applyPlatformCta();
    forwardUtm();
    document.addEventListener('click', onClick);
    window.addEventListener('pagehide', sendLpExit);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') sendLpExit();
    });
    sendSceneView();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
