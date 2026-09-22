// Feedback only: no delayed content, movement, looping effects or live-stock implication.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const running=new Set(),byElement=new WeakMap();
export function feedback(element,{marker=false}={}){
  if(!element||reduced.matches||!element.getClientRects().length)return;
  byElement.get(element)?.cancel();
  const style=getComputedStyle(element);
  const duration=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-feedback'))||180;
  // Keep text fully opaque: fading content can temporarily fail contrast checks.
  const frames=marker?[{boxShadow:'0 0 0 5px #b78b5055'},{boxShadow:style.boxShadow}]:[{boxShadow:'inset 3px 0 0 #b78b50'},{boxShadow:style.boxShadow}];
  const animation=element.animate(frames,{duration,easing:'ease-out'});
  byElement.set(element,animation);running.add(animation);
  const clean=()=>running.delete(animation);animation.onfinish=clean;animation.oncancel=clean;
}
reduced.addEventListener('change',()=>{if(reduced.matches){for(const animation of running)animation.cancel();running.clear();}});
export function installMotion(){
  const values=new Map();
  function scan(){
    for(const selector of ['#result-count','#location-status','#map-status','#page-count']){
      const node=document.querySelector(selector);if(!node)continue;
      const value=node.textContent;
      if(values.has(selector)&&values.get(selector)!==value)feedback(node);
      values.set(selector,value);
    }
    for(const container of document.querySelectorAll('#results,#page-content,#home-picks,#home-rare')){
      const cards=[...container.querySelectorAll('.finding')],key=container.id+':items',ids=cards.map(card=>card.dataset.sighting).join('|');
      if(values.has(key)&&values.get(key)!==ids)feedback(container);
      values.set(key,ids);
      for(const card of cards){
        const badge=card.querySelector('.status-badge');if(!badge)continue;
        const key=container.id+':'+card.dataset.sighting,value=badge.textContent;
        if(values.has(key)&&values.get(key)!==value)feedback(badge);
        values.set(key,value);
      }
    }
  }
  scan();
  const observer=new MutationObserver(scan);
  observer.observe(document.querySelector('main'),{childList:true,subtree:true,characterData:true});
}
