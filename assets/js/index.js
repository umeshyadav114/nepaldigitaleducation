let galler = document.querySelector('.gallery');
let right = document.querySelector('.right-move');
let left = document.querySelector('.left-move');

if (galler && right && left) {
  galler.addEventListener('wheel', (event) => {
    const delta = Math.sign(event.deltaY);
    if (delta === -1) {
      galler.style.scrollBehavior = 'smooth';
      galler.scrollLeft += 400;
    } else {
      galler.style.scrollBehavior = 'smooth';
      galler.scrollLeft -= 400;
    }
  });

  function scroller_sub() {
    galler.scrollLeft -= 400;
    if (galler.scrollLeft <= 0) {
      galler.scrollLeft = 2000;
    }
  }

  function scroller_add() {
    galler.scrollLeft += 400;
    if (galler.scrollLeft > 1600) {
      galler.scrollLeft = 0;
    }
  }

  setInterval(() => {
    galler.style.scrollBehavior = 'smooth';
    scroller_add();
  }, 10000);

  left.addEventListener('click', (evt) => {
    galler.style.scrollBehavior = 'smooth';
    left.classList.add('fa-bounce');
    scroller_sub();
    setTimeout(() => {
      left.classList.remove('fa-bounce');
    }, 500);
  });

  right.addEventListener('click', () => {
    galler.style.scrollBehavior = 'smooth';
    right.classList.add('fa-bounce');
    scroller_add();
    setTimeout(() => {
      right.classList.remove('fa-bounce');
    }, 500);
  });
}
