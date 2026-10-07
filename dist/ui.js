/* Shared compact header for functional pages. Branding belongs to the home/entry screens. */
const actionIcons={
 chevron:'M9 5l7 7-7 7',
 lock:'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4',
 camera:'M3 7h4l2-3h6l2 3h4v13H3zM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
 'qr-scan':'M2 8V3h5M17 3h5v5M22 17v5h-5M7 22H2v-5M6 6h4v4H6zM14 6h4v4h-4zM6 15h4v3H6zM15 16h3v2M2 13h20',
 'qr-show':'M3 3h5v5H3zM11 3h4v5h-4zM3 11h5v5H3zM11 11h2v2h-2zM13 15h2v3h-3M3 20h12M20 20V6M17 9l3-3 3 3',
 copy:'M8 8h12v13H8zM16 8V3H3v13h5'
};
const actionIcon=(name,extraClass='')=>actionIcons[name]?`<svg class="icon ${extraClass}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${actionIcons[name]}"/></svg>`:'';
window.DCBUI={icon:actionIcon,header({title,back=false,action='',iconName=''}){const text=String(title).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return `<header class="page-header">${back?'<button class="page-back btn-text btn-icon btn-neutral" type="button" data-action="back" aria-label="戻る"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>':''}<h1>${actionIcon(iconName,'heading-icon')}${text}</h1>${action}</header>`;}};
