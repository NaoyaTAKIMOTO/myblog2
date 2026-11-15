(function () {
  "use strict";

  function render() {
    if (!window.mermaid) return;

    var nodes = Array.prototype.slice.call(
      document.querySelectorAll(".mermaid")
    );
    if (!nodes.length) return;

    try {
      window.mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "neutral",
        themeVariables: { fontSize: "15px" },
        flowchart: { useMaxWidth: true },
        sequence: { useMaxWidth: true },
      });
      window.mermaid.run({ nodes: nodes }).catch(function (err) {
        console.error("mermaid render failed", err);
      });
    } catch (err) {
      console.error("mermaid init failed", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
