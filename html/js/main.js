(function (doc) {
  function newWin(a) {
    if (a.tagName === 'A') {
      a.target = '_blank';
    }
  }

  window.onload = function () {
    doc.body.addEventListener("click", function (e) {newWin(e.target)}, true);
  };
})(document);
