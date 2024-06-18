function getOrdinalSuffix(day) {
  if (day >= 11 && day <= 13) {
    return `${day}th`;
  }
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
}

function getTodayFormattedDate() {
  const currentDate = new Date();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const month = months[currentDate.getMonth()];
  const day = currentDate.getDate();
  const year = currentDate.getFullYear();
  return `${month} ${getOrdinalSuffix(day)}, ${year}`;
}

function buildDateColumn() {
  const column = document.getElementsByClassName('today-date');
  if (column && column.length > 0) {
    const todayDateContainer = document.createElement('div');
    const calendarIcon = document.createElement('img');
    calendarIcon.src = '/icons/calendar-icon.png';
    calendarIcon.alt = 'Calendar Icon';
    const span = document.createElement('span');
    span.textContent = getTodayFormattedDate();
    todayDateContainer.appendChild(calendarIcon);
    todayDateContainer.appendChild(span);
    column[0].appendChild(todayDateContainer);
  }
}

function addVideoIframe() {
  const anchors = document.querySelectorAll('.highlight a');
  anchors.forEach((anchor) => {
    if (!anchor.classList.contains('button') && anchor.parentElement.children.length === 2) {
      anchor.innerText = '';
      const iframe = document.createElement('i');
      iframe.classList.add('play-button');
      anchor.appendChild(iframe);
      anchor.onmouseover = () => {
        iframe.style.color = '#B54425';
        anchor.style.border = '2px solid #B54425';
      };
      anchor.onmouseout = () => {
        iframe.style.color = 'white';
        anchor.style.border = '2px solid white';
      };
    }
  });
}

export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
  buildDateColumn();
  addVideoIframe();
}
