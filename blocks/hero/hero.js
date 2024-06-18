export default function decorate(block) {
    const h1 = document.createElement('h1');
    const p = block.querySelector('p');
    const div = p.parentNode;
    h1.innerText = p.innerText;
    div.replaceChild(h1, p);
}