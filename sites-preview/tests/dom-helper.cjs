function fakeDOM(){
 const elements=new Map(),answers=[];
 function element(id){let html='';return {id,disabled:false,textContent:'',dataset:{},value:'',children:[],className:'',classList:{values:new Set(),add(...xs){xs.forEach(x=>this.values.add(x))},contains(x){return this.values.has(x)}},setAttribute(k,v){this[k]=v},scrollIntoView(){},append(x){this.children.push(x)},focus(){},set innerHTML(s){html=s;parse(s,id)},get innerHTML(){return html}};}
 function parse(s,id){
  if(id==='main')answers.length=0;
  for(const m of s.matchAll(/<\w+\b([^>]*)>/g)){
   const attrs=m[1],id=attrs.match(/\bid="([^"]+)"/)?.[1],answer=attrs.match(/\bdata-answer="([^"]+)"/)?.[1];
   if(id){const e=element(id);e.disabled=/\bdisabled\b/.test(attrs);elements.set(id,e);}
   if(answer!==undefined){const e=element('answer');e.dataset.answer=answer;e.disabled=/\bdisabled\b/.test(attrs);answers.push(e);}
  }
 }
 for(const id of ['main','connection','voice','parent-link'])elements.set(id,element(id));
 Object.assign(elements.get('voice'),{pause(){},load(){},removeAttribute(){},play(){return Promise.resolve()}});
 return {elements,answers,querySelector(s){return elements.get(s.replace(/^#/,''))||null;},querySelectorAll(s){return s.split(',').flatMap(q=>q==='[data-answer]'?answers:elements.has(q.replace(/^#/,''))?[elements.get(q.slice(1))]:[]);},createElement:()=>element('new')};
}

module.exports=fakeDOM;
