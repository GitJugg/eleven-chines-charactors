/* Original code-native artwork for this family course. No external assets, fonts or tracking. */
'use strict';
(() => {
 const ink='#315a4c',leaf='#70a46b',gold='#efbe5e',blue='#70b9cc',rose='#dc8b83',soil='#b78963';
 const line=`stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
 const g=(shape,x=0,y=0,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${shape}</g>`;
 const ellipse=(x,y,rx,ry,fill)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;
 const circle=(x,y,r,fill)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
 const path=(d,fill='none',stroke=ink,width=5)=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
 const rect=(x,y,w,h,fill,rx=6)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
 const tree=rect(110,88,20,67,soil)+circle(120,72,45,leaf)+circle(87,90,30,'#87b978')+circle(153,90,30,'#87b978');
 const sun=circle(120,85,38,gold)+path('M120 25v-13M120 145v13M60 85H47M180 85h13M77 42L67 32M163 42l10-10M77 128l-10 10M163 128l10 10','none',gold,7);
 const moon=path('M151 30a63 63 0 1 0 21 108A58 58 0 0 1 151 30','#edcd79','#ceac60',3);
 const cloud=path('M62 112C34 111 32 69 65 67C66 25 125 25 136 57C170 34 209 63 192 92C218 122 176 134 154 126H67Z','#fcfdf5','#8ebbc0',4);
 const mountain=path('M24 155L85 49l38 65 35-88 61 129Z','#90af8c','#63856a',4)+path('M70 76l15-27 16 28-15-7Z','#e8e3d0','none')+path('M145 61l13-35 20 44-18-10Z','#e8e3d0','none');
 const stream=path('M128 28C40 60 183 85 86 114C28 132 101 157 127 171','none',blue,30)+path('M128 28C40 60 183 85 86 114C28 132 101 157 127 171','none','#cee9ec',5);
 const flame=path('M123 18C133 65 170 55 170 103C174 165 70 178 65 116C60 86 85 58 96 44C92 75 102 84 110 87C122 65 118 44 123 18Z','#eea260','#bc794b',3)+path('M121 88C128 113 147 119 133 145C110 169 80 139 101 114Z','#f7d978','none');
 const log=rect(48,57,140,69,soil,20)+ellipse(184,91,22,34,'#e6bc84')+ellipse(184,91,12,23,'none')+path('M69 76h79M69 107h85','none','#835e43',4)+`<ellipse cx="184" cy="91" rx="12" ry="23" fill="none" stroke="#a47d55" stroke-width="3"/>`;
 const forest=g(tree,-14,35,.73)+g(tree,83,35,.73);
 const apple=path('M121 62C88 35 58 61 61 98C57 144 104 164 121 150C151 168 188 139 184 98C183 53 151 42 121 62Z',rose,'#b66e64',3)+path('M121 63q-8-29 8-37','none',ink,5)+path('M129 41q10-22 33-14q-5 23-33 14',leaf,ink,3);
 const mouth=path('M44 85Q120 27 196 85Q120 165 44 85Z','#cc8077','#ae605d',4)+path('M62 85Q120 104 178 85Q120 128 62 85Z','#793f42','none')+path('M68 82Q120 49 173 82Q120 99 68 82Z','#fffaf0','none');
 const person=circle(120,43,23,'#e3b891')+path('M120 72v53M120 85L79 111M120 85l41 26M120 125l-30 37M120 125l30 37','none',ink,12)+rect(103,72,34,49,'#e0a766',9);
 const hand=path('M78 138L47 100Q39 85 52 82Q58 80 68 91L80 104V46Q80 31 91 33Q101 34 101 46V80V26Q102 12 113 16Q121 18 121 30V79V31Q122 17 133 23Q140 25 140 39V84V48Q141 35 152 41Q159 44 158 59V109Q159 154 127 162Q99 171 78 138Z','#e6b995','#af8569',4);
 const foot=path('M100 77Q78 116 95 145Q109 169 139 154Q160 146 147 120Q132 94 134 70Z','#e6b995','#af8569',4)+ellipse(137,47,17,23,'#e6b995')+ellipse(110,42,12,17,'#e6b995')+ellipse(88,51,10,14,'#e6b995')+ellipse(73,66,9,12,'#e6b995')+ellipse(64,84,8,10,'#e6b995');
 const eye=path('M33 88Q120 9 207 88Q120 166 33 88Z','#fffdf3',ink,5)+circle(120,88,31,leaf)+circle(120,88,17,ink)+circle(111,78,6,'white');
 const field=path('M28 54L188 34l31 113L51 168Z','#b5c87f',ink,4)+path('M38 90l160-23M45 128l165-23M83 48l25 111M135 41l29 110','none','#7c9a53',5);
 const dirt=ellipse(120,139,93,23,soil)+circle(64,136,7,'#d9b18a')+circle(153,146,9,'#936b4f')+path('M120 134V69','none',ink,5)+path('M119 100Q78 94 82 67Q115 65 119 100M122 87Q157 81 158 54Q124 55 122 87',leaf,ink,3);
 const cow=ellipse(124,98,65,36,'#e0e8d9')+rect(75,110,13,50,soil)+rect(154,110,13,50,soil)+ellipse(170,73,31,32,'#e0e8d9')+path('M147 50l-8-19 18 13M187 49l11-18-3 23','#dac89d',ink,3)+ellipse(170,93,27,16,'#ddb6a1')+circle(160,73,3,ink)+circle(180,73,3,ink)+circle(113,93,20,'#536d5f')+path('M59 90q-25-20-22 8','none',ink,5);
 const goat=ellipse(111,101,54,31,'#c6a27a')+path('M149 104l9-47q7-16 22-10l18 20q4 11-8 15l-20-4-8 34Z','#c6a27a','#927957',3)+path('M80 123l-5 38M136 123l7 38','none','#927957',9)+path('M96 126l-1 34M153 120l9 38','none','#b89570',7)+path('M59 93l-14-14','none','#927957',6)+path('M166 48q-1-35-31-27M179 48q4-37-20-40','none','#71664e',6)+path('M162 58l-19-1 14 12','#b89570','#927957',2)+circle(179,59,3,ink)+'<g class="goat-beard">'+path('M185 81l-7 21-4-22','#927957','none')+'</g>';
 const horse=ellipse(111,105,57,29,'#b98a63')+path('M144 107L157 49Q181 39 191 65L207 79Q210 95 191 98L169 81L166 117Z','#b98a63','#806346',3)+path('M157 48q-22 15-12 48M62 101q-28-22-35 0','none','#6f5946',10)+path('M79 125l-8 35M142 126l14 34','none','#806346',11)+path('M170 48l-1-17 16 16','#b98a63',ink,3)+circle(182,65,3,ink);
 const rain=g(cloud,27,-7,.8)+path('M67 123l-8 20M105 130l-8 20M145 123l-8 20M179 130l-8 20','none',blue,7);
 const wind=path('M29 66h130q40-1 32-26q-9-18-27-1M41 92h153q34 3 20 27q-15 18-30 1M28 119h88q25 0 24 22','none','#75aab4',7)+path('M72 146q19-19 39-5q-13 22-39 5','#8fae68','none');
 const snow=path('M120 24v132M63 57l114 66M63 123l114-66M103 34l17 17 17-17M103 146l17-17 17 17M65 78l23-4-7-23M175 102l-23 4 7 23M81 129l7-23-23-4M159 51l-7 23 23 4','none','#8bbcca',6);
 const flower=(color=rose)=>path('M120 153V83','none',ink,6)+path('M119 130q-38-3-33-26q29-3 33 26M122 117q32-3 32-25q-31 0-32 25',leaf,ink,2)+[circle(120,42,23,color),circle(150,65,23,color),circle(139,99,23,color),circle(102,99,23,color),circle(89,65,23,color),circle(120,72,21,gold)].join('');
 const grass=path('M38 150Q50 105 33 91Q73 111 71 149Q74 76 61 64Q109 87 102 148Q115 61 141 41Q121 99 131 149Q149 93 182 77Q164 115 167 150Q195 114 211 115L202 151Z',leaf,ink,3);
 const singleLeaf=path('M59 141Q28 54 187 28Q201 135 59 141Z',leaf,ink,4)+path('M47 156L171 45M88 119l-7-32M117 93l36 4','none','#d7e7b7',5);
 const arrow=(d)=>path(d,'none','#c68645',9);
 const positions={
  '上':g(tree,42,52,.6)+circle(118,24,14,rose)+arrow('M170 107V37m-14 14 14-14 14 14'),
  '下':g(tree,42,-4,.6)+circle(118,154,14,rose)+arrow('M170 73v70m-14-14 14 14 14-14'),
  '中':rect(32,68,48,48,'#c5d6bc')+rect(96,58,48,66,rose)+rect(160,68,48,48,'#c5d6bc')+arrow('M120 22v23m-9-9 9 9 9-9'),
  '左':circle(120,92,13,'#b9ceb0')+circle(45,92,22,rose)+circle(195,92,22,'#d8dfce')+arrow('M128 41H52m14-12L52 41l14 12'),
  '右':circle(120,92,13,'#b9ceb0')+circle(195,92,22,rose)+circle(45,92,22,'#d8dfce')+arrow('M112 41h76m-14-12 14 12-14 12')
 };
 const shapes={'日':sun,'月':moon,'山':mountain,'水':stream,'火':flame,'木':log,'林':forest,'森':g(tree,47,-7,.7)+g(tree,-7,43,.72)+g(tree,74,43,.72),'大':g(apple,-14,-6,1)+g(apple,146,105,.29)+'<g class="size-pointer">'+path('M30 30l30 28m-16-1 16 1-2-16','none','#c68645',6)+'</g>','小':g(apple,16,84,.43)+g(apple,89,3,.78)+path('M59 73v-17m-8 8 8 9 8-9','none','#c68645',5),'人':person,'口':mouth,'手':hand,'足':foot,'目':eye,'田':field,'土':dirt,'牛':cow,'羊':goat,'马':horse,'天':rect(17,21,206,138,'#c7e6ea',20)+g(sun,111,10,.4)+g(cloud,5,30,.7),'云':cloud,'雨':rain,'风':wind,'雪':snow,'花':flower(),'草':grass,'叶':singleLeaf,'红':g(flower('#dc7971'),-13,18,.85)+'<rect class="color-swatch" x="158" y="80" width="65" height="65" rx="12" fill="#dc7971" stroke="#b56a62" stroke-width="3"/>','白':g(cloud,-6,5,.76)+rect(147,69,84,86,'#a9bbb1',16)+'<rect class="color-swatch" x="158" y="80" width="62" height="64" rx="10" fill="#ffffff"/>',...positions};
 const labels={'日':'金色太阳和向外散开的阳光','月':'夜空中的弯弯月亮','山':'高高低低的山峰','水':'弯弯流动的河水','火':'向上升起的火苗','木':'有年轮和纹理的木头','林':'两棵树组成的小树林','森':'三棵树组成的森林','大':'一大一小两个苹果，箭头指向大苹果','小':'一大一小两个苹果，箭头指向小苹果','人':'张开手臂站立的人','口':'张开的嘴巴','手':'张开的五指小手','足':'脚掌和五个脚趾','目':'一只明亮的眼睛','田':'分成小块的田地','土':'土壤里长出小芽','牛':'有牛角和斑纹的小牛','羊':'有后弯角和短须的山羊','马':'长着鬃毛的小马','天':'蓝色天空中有太阳和云','云':'一朵白云','雨':'云朵下落下雨滴','风':'风吹动了叶子','雪':'六个角的雪花','花':'花瓣围着花心的小花','草':'一丛小草','叶':'一片带叶脉的绿叶','红':'红色色块和红色的花','白':'灰绿底板上的白色色块和白云','上':'树的上面有红色圆点，箭头向上','下':'树的下面有红色圆点，箭头向下','中':'三个积木，中间的积木是红色','左':'三个圆点，左边的圆点是红色，箭头向左','右':'三个圆点，右边的圆点是红色，箭头向右'};
 const words={'日光':'日','月亮':'月','大山':'山','河水':'水','火苗':'火','木头':'木','树林':'林','森林':'森','大树':'bigTree','小草':'草','人们':'people','开口':'口','小手':'手','手足':'handsFeet','目光':'目','田地':'田','泥土':'土','小牛':'牛','山羊':'羊','小马':'马','天空':'天','白云':'云','雨水':'雨','大风':'风','雪花':'雪','小花':'花','树叶':'leafTree','红花':'红','上山':'upHill','下山':'downHill','中间':'中','左手':'leftHand','右手':'rightHand'};
 const extras={bigTree:g(tree,20,-9,1)+g(tree,-5,100,.35),people:g(person,-24,35,.75)+g(person,48,-4,1),handsFeet:g(hand,4,5,.8)+g(foot,113,71,.58),leafTree:g(tree,-17,19,.8)+g(singleLeaf,110,83,.45),upHill:g(mountain,0,0,1)+arrow('M66 137l47-78m-18 5 18-5 6 18'),downHill:g(mountain,0,0,1)+arrow('M109 64l49 77m-19-5 19 5 4-19'),leftHand:`<g transform="translate(240 0) scale(-1 1)">${g(hand,-10,10,.82)}</g>`+arrow('M164 42h-35m12-10-12 10 12 10'),rightHand:g(hand,-10,10,.82)+arrow('M76 42h35m-12-10 12 10-12 10')};
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function svg(shape,label,view='0 0 240 180',className='character-art'){return `<svg class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="${view}" role="img" aria-label="${safe(label)}"><title>${safe(label)}</title>${shape}</svg>`;}
 function character(char){return svg(shapes[char]||tree,labels[char]||'一棵小树');}
 function word(word,char){const key=words[word]||char;return svg(extras[key]||shapes[key]||tree,word+'的配图');}
 function mascot(kind='listen'){
  const expression=kind==='success'?path('M99 111q21 24 42 0','none',ink,5):kind==='try'?path('M102 117q18-12 36 0','none',ink,4):path('M104 114q16 15 32 0','none',ink,4);
  const body=ellipse(120,113,52,43,'#d2dcb1')+path('M121 75V43','none',ink,5)+path('M121 57Q82 55 88 28Q119 28 121 57M122 48Q149 46 151 21Q123 24 122 48',leaf,ink,3)+circle(102,102,4,ink)+circle(139,102,4,ink)+expression+ellipse(87,115,8,4,'#e9b49b')+ellipse(154,115,8,4,'#e9b49b');
  const detail=kind==='listen'?path('M63 101v-9a57 57 0 0 1 114 0v9','none',blue,7)+rect(55,94,15,30,blue)+rect(170,94,15,30,blue):kind==='success'?path('M183 78l12 12 22-30','none','#528663',8):path('M190 79q17-21 29 0q8 11-10 21v8','none','#c38c50',5)+circle(208,121,3,'#c38c50');
  return svg(body+detail,kind==='success'?'小芽笑着鼓励你':kind==='try'?'小芽陪你再想一想':'小芽戴着耳机认真听声音','0 0 240 180','sprout-mascot');
 }
 function story(day,index=0){
  const cabin=rect(82,75,80,78,'#efdaad',10)+path('M68 79l54-47 55 47','#b78e65','#976d4e',4)+rect(112,110,24,43,'#7ea178',8);
  const ground=path('M0 161Q150 135 300 164T600 151V210H0Z','#d8e4be','none');
  let scene='';
  if(day===1)scene=g(index?moon:sun,385,-5,.65)+g(mountain,10,23,.85)+(index?'':g(stream,269,55,.85)+g(cabin,178,52,.65));
  if(day===2)scene=g(tree,20,14,1)+g(tree,180,-15,1.15)+g(tree,370,58,.68);
  if(day===3)scene=index?g(eye,23,22,.8)+g(hand,291,12,.85):g(person,168,3,1)+g(hand,6,30,.67)+`<g transform="translate(600 0) scale(-1 1)">${g(hand,6,30,.67)}</g>`;
  if(day===4)scene=g(field,10,58,.8)+g(mountain,375,5,.65)+(index?g(horse,172,38,.9):g(cow,149,45,.83)+g(goat,386,-6,.56));
  if(day===5)scene=index?g(rain,22,-4,1)+g(snow,325,27,.8):g(cloud,14,-19,.95)+g(wind,285,29,.9);
  if(day===6)scene=g(flower('#dc7971'),38,26,.8)+g(grass,186,70,.65)+g(tree,327,12,.9)+(index?g(cloud,191,-23,.65):g(singleLeaf,424,77,.4));
  if(day===7)scene=index?g(mountain,176,22,.9)+g(cloud,185,-31,.75)+g(grass,25,98,.5)+g(flower(),437,83,.53):g(hand,101,19,.85)+`<g transform="translate(600 0) scale(-1 1)">${g(hand,101,19,.85)}</g>`+path('M284 66v-15M269 73l-10-10M299 73l10-10','none',gold,5);
  const descriptions=[['太阳照着山和河水','月亮升起，小山安静'],['大树、小树和树林','森林里高高低低的树'],['张开双手向朋友问好','用眼睛找一找小手'],['田边的小牛和山上的羊','小马走过田地'],['白云和吹动叶子的风','雨滴和雪花'],['红花、小草和树叶','白云飘过花草'],['左手和右手一起拍一拍','小山在中间，云在上，花草在下']];
  return svg(rect(0,0,600,200,day===1&&index?'#dde3dc':'#e9f2e4',20)+ground+scene,descriptions[day-1]?.[index]||'小芽的花园','0 0 600 200','story-art');
 }
 globalThis.SproutArt=Object.freeze({character,word,story,mascot});
})();
