import { createOptimizedPicture } from '../../scripts/aem.js';

function addMobileViewElements() {
  const cardsBody = document.querySelector('.updates .cards');
  if (!cardsBody) {
    return;
  }
  const readMoreMobileElement = document.createElement('div');
  readMoreMobileElement.classList.add('mobile-read-more-wrap');
  const readMoreAnchor = document.createElement('a');
  readMoreAnchor.href = 'https://www.clarkcountynv.gov/newslist.php';
  readMoreAnchor.classList.add('mobile-read-more');
  readMoreAnchor.textContent = 'Read More';
  readMoreMobileElement.appendChild(readMoreAnchor);
  cardsBody.appendChild(readMoreMobileElement);
  if (window.innerWidth <= 991) {
    const cardHeadings = document.querySelectorAll('.updates .cards li');
    const cardListItem1 = document.querySelector('.updates .cards li:nth-child(1)');
    cardHeadings[0].insertBefore(
      cardListItem1.children[1].children[0],
      cardHeadings[0].children[0],
    );
    const cardListItem2 = document.querySelector('.updates .cards li:nth-child(2)');
    cardHeadings[1].insertBefore(
      cardListItem2.children[1].children[0],
      cardHeadings[1].children[0],
    );
  }
}
function adjustDescriptionHeight() {
  const strongTags = document.querySelectorAll('.cards-wrapper strong');
  strongTags.forEach((strongTag, index) => {
    if (index < 3) {
      strongTag.style.height = '70px';
    } else if (index >= 3 && index < 6) {
      strongTag.style.height = '47px';
    }
  });
}
function appendArrowImagesToAnchors() {
  const aTags = document.querySelectorAll('.cards-wrapper .cards-card-body .button-container a');
  aTags.forEach((a) => {
    const { innerText } = a;
    a.innerHTML = '';
    const span = document.createElement('span');
    span.innerText = innerText;
    const img = document.createElement('img');
    img.src = '/icons/white-arrow-right.png';
    img.alt = 'Right Arrow';
    a.append(span, img);
  });
}

function validateAndCorrectCardsText() {
  const cardBodyElements = document.querySelectorAll('.cards-wrapper .cards-card-body');
  cardBodyElements.forEach((cardBody) => {
    if (cardBody.children.length === 2 && cardBody.querySelector('p strong')) {
      const description = cardBody.querySelector('strong').textContent;
      cardBody.querySelector('strong').remove();
      const strongTag = document.createElement('strong');
      strongTag.textContent = description;
      cardBody.insertBefore(strongTag, cardBody.children[1]);
    }
  });
}

function decorateUpdatesSection() {
  if (document.querySelector('.updates-decorated')) {
    return;
  }
  appendArrowImagesToAnchors();
  validateAndCorrectCardsText();
  adjustDescriptionHeight();
  addMobileViewElements();
  document.querySelectorAll('.updates').forEach((updateElement) => {
    updateElement.classList.add('updates-decorated');
  });
}

function addSeeMoreInEvents() {
  const seeMoreElement = document.querySelector('.highlight .section-bottom a');
  const { innerText } = seeMoreElement;
  seeMoreElement.innerHTML = '';
  const span = document.createElement('span');
  span.innerText = innerText;
  const img = document.createElement('img');
  img.src = '/icons/white-arrow-right.png';
  img.alt = 'Right Arrow';
  seeMoreElement.append(span, img);
}
export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.textContent = '';
  block.append(ul);
  decorateUpdatesSection();
  addSeeMoreInEvents();
}
