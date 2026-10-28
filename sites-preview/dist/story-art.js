/* Original semantic SVG scenes for the 53 first-stage story packages.
 * Illustrations and choices belong to supported comprehension, never to unaided recognition.
 * No external assets, runtime network requests, child data, or embedded answer text. */
'use strict';
(function(root){
 const C={ink:'#254b65',skin:'#ffd5ad',blue:'#31a9ee',green:'#36b98b',yellow:'#ffd76a',pink:'#f28fa7',wood:'#c18b58',white:'#fffdf6'};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const path=(d,f='none',s=C.ink,w=4)=>`<path d="${d}" fill="${f}" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
 const rect=(x,y,w,h,f,r=6,s='none')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" stroke="${s}" stroke-width="3"/>`;
 const circle=(x,y,r,f,s='none')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" stroke="${s}" stroke-width="3"/>`;
 const ellipse=(x,y,rx,ry,f,s='none')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" stroke="${s}" stroke-width="3"/>`;
 const g=(body,x=0,y=0,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${body}</g>`;
 const line=(x,y,x2,y2,c=C.ink,w=4)=>path(`M${x} ${y}L${x2} ${y2}`,'none',c,w);
 function sun(x=505,y=55){return circle(x,y,28,C.yellow)+Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return line(x+Math.cos(a)*36,y+Math.sin(a)*36,x+Math.cos(a)*44,y+Math.sin(a)*44,C.yellow,5);}).join('');}
 const cloud=(x,y,s=1,col='#fff')=>g(circle(0,0,22,col)+circle(28,-12,30,col)+circle(60,0,22,col)+rect(-15,0,87,21,col,10),x,y,s);
 function room(night=false){return rect(0,0,600,320,night?'#dce7fa':'#fff4d8',20)+rect(0,245,600,75,'#f2cf98',0)+line(0,245,600,245,'#dfb37a',3)+rect(390,24,152,140,'#fff',9,C.wood)+rect(400,34,132,120,night?'#254779':'#9edffb',4)+(night?path('M480 48a27 27 0 1 0 28 40a25 25 0 0 1-28-40','#fff0ad','none'):sun(468,76))+line(466,34,466,154,'#fff',7)+line(400,94,532,94,'#fff',7)+path('M378 20v157l25-20V20M554 20v157l-20-20V20','#89cfc0','none');}
 function outdoors(weather='sun'){return rect(0,0,600,320,weather==='night'?'#264c7e':'#c9eeff',20)+(weather==='sun'?sun():weather==='night'?circle(496,47,25,'#fff0bd'):cloud(430,65,1.5,'#8eacbf'))+cloud(80,60,1.1,weather==='rain'?'#8eacbf':'#fff')+path('M0 243Q130 180 295 236T600 216V320H0Z','#8ed5a0','none')+path('M0 285Q220 235 600 279V320H0Z','#61bf8d','none');}
 function person(x,y,opts={}){const {scale=1,color=C.blue,hair='#584233',kind='child',pose='stand',emotion='happy'}=opts;
  const long=kind==='mom'||kind==='girl',elder=kind==='grandpa'||kind==='grandma';
  let arms=pose==='reach'?path('M-23 74L-34 111','none',C.skin,14):pose==='receive'?path('M23 74L34 111','none',C.skin,14):pose==='open'?path('M-23 74L-58 54M23 74L58 54','none',C.skin,14):['hold','walkHold'].includes(pose)?path('M-23 74L-37 97L-4 91M23 74L37 97L4 91','none',C.skin,14):pose==='dribble'?path('M-23 74L-34 111M23 74L59 96L87 101','none',C.skin,14):pose==='point'?path('M-23 74L-42 104M23 74L61 61','none',C.skin,14):pose==='face'?path('M-23 74L-29 37M23 74L29 37','none',C.skin,14):pose==='run'?path('M-23 74L-48 49M23 74L44 97','none',C.skin,14):path('M-23 74L-34 111M23 74L34 111','none',C.skin,14);
  const legs=pose==='sit'?path('M-12 122L-30 147L-53 147M12 122L34 147L58 147','none','#426992',14):['walk','walkHold'].includes(pose)?path('M-12 122L-25 154M12 122L27 150','none','#426992',14):pose==='run'?path('M-12 122L-42 148M12 122L35 157','none','#426992',14):path('M-13 122L-15 157M13 122L16 157','none','#426992',14);
  const h=elder?'#e4e6e0':hair;
  let face=emotion==='sleep'?path('M-17 26q6 5 12 0M5 26q6 5 12 0','none',C.ink,3):circle(-12,26,3,C.ink)+circle(12,26,3,C.ink);
  face+=emotion==='sad'?path('M-8 46q8-9 16 0','none',C.ink,3)+path('M-18 33q-9 12 0 14q9-2 0-14','#73cdf9','none'):emotion==='sleep'?ellipse(0,43,4,3,'#d87d6e'):path('M-9 42q9 11 18 0','none',C.ink,3);
  if(elder)face+=circle(-12,26,10,'none',C.ink)+circle(12,26,10,'none',C.ink)+line(-2,26,2,26,C.ink,2);
  return g(ellipse(0,167,45,8,'#5e987831')+legs+(long?path('M-31 27Q-47-15 0-16Q48-12 32 52L-30 50Z',h,'none'):'')+arms+path('M-25 63Q0 52 25 63L29 124H-29Z',color,C.ink,2)+circle(0,25,32,C.skin)+path('M-31 20Q-38-13 0-12Q36-11 33 20L18 5Q-2 17-21 7Z',h,'none')+face+(kind==='grandma'?circle(27,-7,14,h):'')+(long?circle(-30,31,7,h)+circle(30,31,7,h):''),x,y,scale);
 }
 function book(x,y,s=1,color='#f4776c',open=true){return g(open?path('M0 6Q-29-12-65-3V66Q-31 56 0 75Q29 56 65 66V-3Q29-12 0 6Z','#fffefa',C.ink,3)+path('M0 7V73','none',C.ink,3)+[-1,1].map(q=>[19,31,43].map(h=>line(q*12,h,q*52,h,'#98b7c3',3)).join('')).join(''):rect(-45,-6,90,70,color,5,C.ink)+rect(-29,4,64,44,'#fff2d8',3)+line(-35,-3,-35,58,C.ink,3)+path('M-39 58H42V69H-39q-9-5 0-11','#fffaf0',C.ink,2)+line(-30,64,37,64,'#afc4c9',2),x,y,s);}
 function table(x=300,y=214,s=1){return g(rect(-130,-12,260,24,C.wood,7)+path('M-106 12v80M106 12v80','none','#a46d45',14),x,y,s);}
 function chair(x,y,s=1){return g(rect(-38,-5,76,86,'#8bc8da',8,C.ink)+rect(-44,73,88,16,'#6cb5ce',5,C.ink)+path('M-34 90v47M34 90v47','none',C.wood,9),x,y,s);}
 function bed(x=300,y=213,s=1){return g(rect(-156,-72,312,99,'#efb4ba',14,C.ink)+rect(-147,-63,87,66,'#fffdf2',14)+rect(-52,-60,200,82,'#75c8df',12)+line(-156,-92,-156,66,C.wood,12)+line(156,-60,156,66,C.wood,12),x,y,s);}
 function bowl(x,y,s=1,fill='#fff',food='rice'){let body=path('M-47 0Q-40 48 0 49Q40 48 47 0Z',fill,C.ink,3)+ellipse(0,0,47,13,food==='soup'?'#ffd063':'#fffdf3',C.ink);if(food==='rice')body+=[[-25,-7],[-10,-11],[10,-9],[25,-5],[-14,1],[9,1]].map(([a,b])=>ellipse(a,b,8,3,'#e8e8d8')).join('');if(food==='greens')body+=Array.from({length:5},(_,i)=>ellipse(i*14-28,-4,14,10,'#58b77a')).join('');return g(body,x,y,s);}
 function cup(x,y,s=1,drink='water'){return g(rect(-24,-5,48,63,'#f9fcff',7,C.ink)+path('M25 8Q58 2 48 35Q44 44 25 38','none',C.ink,5)+rect(-18,drink==='milk'?5:20,36,29,drink==='milk'?'#fff8db':drink==='juice'?'#ffbd4a':'#7cd6ee',3)+ellipse(0,-5,24,7,'#eefcff',C.ink),x,y,s);}
 const steam=(x,y)=>g(path('M-20 0q-12-15 0-29q13-15 0-29M4 0q-12-15 0-29q13-15 0-29M28 0q-12-15 0-29q13-15 0-29','none','#819ba8',5),x,y);
 const shirt=(x,y,s=1,color=C.yellow)=>g(path('M-25-40L-62-17L-43 12L-27 2V61H27V2L43 12L62-17L25-40Q0-19-25-40Z',color,C.ink,3),x,y,s);
 const flower=(x,y,s=1,color=C.pink)=>g(path('M0 5v53M0 35q-34-17-26-31q27 1 26 31M0 45q32-24 31-34q-26 0-31 34','#42ac72','#328e5d',3)+[0,1,2,3,4,5].map(i=>circle(Math.cos(i*Math.PI/3)*16,Math.sin(i*Math.PI/3)*16,13,color)).join('')+circle(0,0,11,C.yellow),x,y,s);
 const ball=(x,y,r=28)=>circle(x,y,r,'#faac51',C.ink)+path(`M${x-r} ${y}H${x+r}M${x} ${y-r}q${-r*.5} ${r} 0 ${r*2}M${x-r*.7} ${y-r*.7}Q${x+r*.8} ${y} ${x-r*.7} ${y+r*.7}`,'none','#b97532',2);
 function tree(x,y,s=1){return g(path('M-13 0L-18 155H19L13-2Z',C.wood,'#9f714b',3)+path('M0 60L-47 16M0 87L52 40','none',C.wood,15)+circle(-38,0,48,'#58bb89')+circle(35,-7,56,'#66c78e')+circle(0,-48,54,'#84d69c'),x,y,s);}
 const house=(x,y,s=1)=>g(rect(-77,-44,154,132,'#fff2cb',6,C.ink)+path('M-95-40L0-112L95-40Z','#f28b66',C.ink,4)+rect(-15,19,40,69,'#5bbcae',15,C.ink)+rect(-59,-23,35,34,'#8edcfa',4,C.ink)+rect(29,-23,35,34,'#8edcfa',4,C.ink)+line(-42,-23,-42,11,'#fff',3)+line(46,-23,46,11,'#fff',3),x,y,s);
 function vehicle(type,x,y,s=1){let body=type==='boat'?path('M-104 10H104L67 62H-69Z','#ed9665',C.ink,4)+path('M-54 4v-57h93V4','#fff8e8',C.ink,4)+rect(-41,-40,65,35,'#83d9f2',4):type==='bus'?rect(-126,-74,252,121,C.blue,18,C.ink)+[0,1,2,3,4].map(i=>rect(-111+i*45,-61,38,43,'#c9f2ff',4,C.ink)).join('')+rect(66,-10,43,55,'#8edcf4',3,C.ink):path('M-116 1L-86-52H52L89-7L119 4V48H-120Z','#ed9d58',C.ink,4)+path('M-75-40H-17V-4H-95ZM-5-40H45L73-4H-5Z','#bdeefa',C.ink,3);if(type!=='boat')body+=circle(-74,48,24,C.ink)+circle(74,48,24,C.ink)+circle(-74,48,11,'#e4f4f5')+circle(74,48,11,'#e4f4f5');return g(body,x,y,s);}
 function animal(type,x,y,s=1,color){const col=color||({rabbit:'#fffdf0',sheep:'#fffdf1',dog:'#b48353',cat:'#e9ac67',pig:'#ef9da9',horse:'#b37f51',bird:'#ffd45d',chick:'#ffda62',duck:'#f9dd83',goose:'#fffaf0',fish:'#fda861'}[type]);let body='';
  if(['bird','chick','duck','goose'].includes(type)){body=ellipse(0,10,37,26,col,C.ink)+circle(27,-12,23,col,C.ink)+path('M46-16L67-7L47 0Z','#ef9b48',C.ink,2)+circle(34,-16,3,C.ink)+path('M-21 5q35-25 34 16q-24 14-34-16','none',C.ink,3)+path('M-13 35v17h-14M13 35v17h14','none','#d89045',4);if(type==='goose')body=path('M9 15q-4-24 10-46q16-12 26 5q6 16-12 23v27',col,C.ink,3)+body;if(type==='chick')body+=path('M20-33q-9-14 0-14q6-3 9 10q8-17 16-8q5 5-6 13','#ed7965','none');}
  else if(type==='fish'){body=path('M-53 0L-84-26V26Z','#f19458',C.ink,3)+ellipse(0,0,59,32,col,C.ink)+circle(34,-6,5,C.ink)+path('M-13-6L8 14L-22 13Z','#ffd17e',C.ink,2);}
  else{body=ellipse(0,20,type==='horse'?62:52,type==='pig'?39:31,col,C.ink)+path('M-33 43v26M25 43v26','none',col,14)+path('M-33 43v26M25 43v26','none',C.ink,3)+circle(46,-1,type==='horse'?27:32,col,C.ink);if(type==='rabbit')body+=ellipse(29,-45,10,32,col,C.ink)+ellipse(57,-46,10,32,col,C.ink)+ellipse(29,-45,4,23,'#edb3b3')+ellipse(57,-46,4,23,'#edb3b3');else if(type==='cat')body+=path('M20-17L24-49L43-28M49-29L70-49L73-15',col,C.ink,3);else if(type==='dog')body+=ellipse(23,-4,12,28,'#624e43',C.ink)+ellipse(72,-4,10,26,'#624e43',C.ink);else if(type==='sheep')body+=[[-38,0],[-13,-7],[14,-5],[-45,25],[-20,29],[5,29]].map(([a,b])=>circle(a,b,22,col,C.ink)).join('');else if(type==='pig')body+=path('M20-18L18-43L42-25M49-27L75-40L71-9',col,C.ink,3)+ellipse(65,9,19,13,'#e28195',C.ink)+circle(60,9,2,C.ink)+circle(70,9,2,C.ink);else if(type==='horse')body+=path('M26-20L30-48L44-25M51-23L63-45L68-16',col,C.ink,3)+path('M-50 7q-36-11-26 62','none','#6a4a37',12);body+=circle(51,-6,4,C.ink)+(type==='pig'?'':circle(70,9,4,C.ink));if(!['horse','sheep'].includes(type))body+=path('M-48 12q-32-10-19-29','none',col,12);}
  return g(body,x,y,s);
 }
 const water=(y=235)=>path(`M0 ${y}Q45 ${y-17} 90 ${y}T180 ${y}T270 ${y}T360 ${y}T450 ${y}T600 ${y}V320H0Z`,'#72cceb','none')+path(`M20 ${y+28}q32 12 63 0M160 ${y+40}q40 14 80 0M370 ${y+28}q40 14 80 0`,'none','#e1faff',5);
 const bridge=()=>path('M112 250Q300 70 488 250L488 279Q300 112 112 279Z',C.wood,C.ink,4)+path('M123 213Q300 45 477 213','none',C.wood,12)+[150,200,250,300,350,400,450].map(x=>line(x,Math.abs(x-300)*.56+116,x,Math.abs(x-300)*.56+161,C.wood,6)).join('');
 const towel=(x,y,s=1)=>g(rect(-38,-30,76,90,'#66c5e1',7,C.ink)+line(-30,43,30,43,'#fff',5)+line(-30,53,30,53,'#fff',3),x,y,s);
 const bread=(x,y,s=1,half=false)=>g(path(half?'M-48 0Q-54-42 2-42V43H-46Z':'M-47 0Q-60-45 0-42Q60-45 47 0V43H-47Z','#eeb66d',C.ink,3)+path(half?'M-34 1Q-40-26 1-27V30H-33Z':'M-33 1Q-45-27 0-27Q45-27 33 1V30H-33Z','#ffdfa0','none'),x,y,s);
 const pencil=(x,y,s=1)=>g(path('M-52 20L38-27L48-8L-41 40L-63 42Z',C.yellow,C.ink,3)+path('M-63 42L-43 38L-52 20Z','#f2c3a0',C.ink,2),x,y,s);
 const fruit=(type,x,y,s=1)=>g(type==='pear'?path('M-8-27Q8-44 17-13Q19 0 29 14Q39 50 0 50Q-38 50-31 16Q-17-2-8-27Z','#bbd868',C.ink,3):type==='melon'?ellipse(0,13,47,39,'#70b878',C.ink)+[-25,0,25].map(a=>path(`M${a} -20q-15 32 0 65`,'none','#368d63',4)).join(''):path('M0-15Q-37-38-37 5Q-39 36 0 51Q39 36 37 5Q37-38 0-15Z','#f5a49b',C.ink,3),x,y,s);
 const lamp=(x,y,on=true)=>g((on?path('M-42-15L-83 108H83L42-15Z','#fff2a480','none'):'')+path('M-36-57H36L57-3H-57Z',on?C.yellow:'#a4bbc3',C.ink,4)+line(0,0,0,89,C.ink,7)+ellipse(0,92,37,8,C.wood),x,y);
 const tv=(x,y,on=true)=>g(rect(-81,-58,162,112,C.ink,12)+rect(-70,-46,140,85,on?'#8bdbf4':'#627789',7)+(on?path('M-70 38L-25-25L16 18L48-9L70 38Z','#5ab67c','none')+circle(44,-23,13,C.yellow):'')+line(0,55,0,75,C.ink,7)+line(-44,78,44,78,C.ink,8),x,y);
 const bubbles=(x,y)=>[[-20,-15,12],[10,-28,16],[33,-7,12],[-42,6,9],[0,-4,17]].map(([a,b,r])=>circle(x+a,y+b,r,'#effcff','#a9dfea')).join('');
 function eat(who='child',food='rice',tool='spoon'){return room()+person(300,74,{kind:who,color:who==='mom'?C.pink:C.blue,pose:'reach'})+table(300,235)+bowl(300,201,.9,'#75c9e2',food)+path('M326 164L347 188L364 199','none',C.skin,12)+(tool==='spoon'?g(ellipse(0,0,11,17,'#cedde5',C.ink)+line(0,16,0,63,C.ink,6),364,169,.8):line(343,172,371,221,C.wood,5)+line(357,170,379,221,C.wood,5));}
 function drink(kind='water'){return room()+person(280,76,{pose:'reach'})+table(300,235)+path('M303 150L337 168L334 143','none',C.skin,12)+cup(299,124,.8,kind)+(kind==='juice'?fruit('pear',155,220,.75)+fruit('peach',430,220,.8):'');}
 function read(kind='child'){return room(true)+person(278,81,{kind,pose:'hold',color:kind==='mom'?C.pink:C.green})+book(278,177,.8)+lamp(470,193,true);}
 function sleeping(){return room(true)+bed(300,210)+`<g transform="translate(199 181) rotate(-90) scale(.75)">${person(0,0,{emotion:'sleep'})}</g>`+rect(252,154,191,78,'#72bfdc',16)+path('M267 169H426','none','#a4e2ed',5)+circle(491,50,4,'#fff');}
 function dressing(){return room()+bed(450,229,.65)+person(210,75,{pose:'open'})+shirt(210,165,.74,C.yellow)+shirt(391,238,.45,C.blue);}
 function washFace(){return room()+person(290,85,{pose:'face'})+towel(290,128,.64)+bubbles(282,210)+rect(201,230,180,30,'#8dd7e6',15,C.ink);}
 function washHair(){return room()+person(300,100,{pose:'face'})+bubbles(300,91)+path('M370 55q-15-32-55-12','none','#8eaebd',11)+[0,1,2,3].map(i=>line(326+i*10,50,315+i*10,75,'#4eabdd',3)).join('')+rect(215,248,175,30,'#83d5e8',10,C.ink);}
 function brushTeeth(){return room()+person(290,80,{pose:'face'})+rect(300,123,63,8,'#56bba6',3,C.ink)+rect(296,112,23,15,'#fff',3,C.ink)+cup(190,220,.9)+rect(174,259,216,17,'#95d5e2',6);}
 function laundry(clean=true){return room()+person(172,95,{pose:'reach'})+rect(286,201,190,80,'#87d5e7',30,C.ink)+path('M195 181L262 205L328 206','none',C.skin,13)+shirt(373,173,.68,clean?'#fff9df':'#e7c790')+(clean?bubbles(368,223):circle(354,183,10,'#9c8360')+circle(393,163,13,'#9c8360'))+towel(515,201,.6);}
 const scenes={
  family:()=>room()+house(92,164,.55)+person(245,42,{kind:'dad',scale:1.3,pose:'open'})+person(431,48,{kind:'mom',color:C.pink,scale:1.25,pose:'open'})+person(337,127,{color:C.green,scale:.85,pose:'open'}),
  dressing,sleeping,eating:()=>eat()+cup(188,206,.65,'milk'),drinking:()=>drink(),milk:()=>drink('milk'),juice:()=>drink('juice'),reading:()=>read(),
  elders:()=>room()+person(210,65,{kind:'grandpa',pose:'hold',color:C.green})+person(408,65,{kind:'grandma',pose:'hold',color:C.pink})+book(210,165,.7)+book(408,165,.7),
  flowers:()=>outdoors()+person(265,95,{kind:'girl',pose:'point',color:C.pink})+flower(385,178,1.3)+flower(455,218,.8,C.yellow)+tree(71,138,.7),
  washFace,washHair,brushTeeth,laundry:()=>laundry(),dirtyShirt:()=>laundry(false),
  breadMom:()=>room()+person(287,74,{kind:'mom',color:C.pink,pose:'hold'})+table(300,235)+bread(287,188,.85)+cup(435,204,.65),
  eggsDad:()=>eat('dad','greens','chopsticks')+ellipse(213,212,25,14,'#fff',C.ink)+circle(213,208,11,'#ffcb54'),
  spoon:()=>eat('child','rice','spoon'),chopsticks:()=>eat('dad','greens','chopsticks'),
  washDishes:()=>room()+person(230,77,{kind:'mom',color:C.pink,pose:'hold'})+rect(240,220,240,40,'#89d9e5',20,C.ink)+bowl(294,213,.7)+cup(407,181,.8)+bubbles(358,228),
  hotSoup:()=>room()+table(300,230)+bowl(300,213,1.6,'#6cc8dd','soup')+steam(300,173)+person(97,137,{scale:.65,pose:'point'}),
  coldMilk:()=>room()+table(300,240)+cup(300,177,1.55,'milk')+circle(410,210,30,'#daeff8')+path('M410 187v45M390 198l40 23M390 222l40-23','none','#7bc9eb',4),
  fruitBasket:()=>room()+table(300,245)+fruit('melon',216,190,1)+fruit('peach',309,185,.9)+fruit('pear',397,180,1)+path('M160 220H454L425 277H187Z','#d8a76b',C.ink,4),
  full:()=>room()+person(300,65,{pose:'hold'})+table(300,235)+ellipse(300,217,55,15,'#fff',C.ink)+bowl(447,215,.6),
  windowTable:()=>room()+table(465,204,.75)+chair(310,190,.72)+person(306,139,{kind:'grandpa',pose:'sit',scale:.7})+rect(26,62,92,180,'#84c4a5',8,C.wood)+circle(100,153,5,C.wood),
  lampOn:()=>room(true)+person(234,92,{pose:'point'})+lamp(414,167,true)+tv(93,174,false),
  tvOn:()=>room(true)+person(180,101,{kind:'dad',pose:'sit'})+tv(424,174,true)+lamp(70,174,false),
  tvOff:()=>room(true)+person(273,90,{kind:'mom',color:C.pink,pose:'point'})+tv(446,174,false)+lamp(70,174,true),
  bookHand:()=>room()+person(263,70,{pose:'hold'})+book(263,166,.85)+table(470,238,.5),
  bookTable:()=>room()+table(305,219)+book(308,180,.76,'#f4776c',false)+person(95,122,{scale:.75,pose:'point'}),
  bookChair:()=>room()+chair(317,155,1)+book(317,183,.65,'#f4776c',false)+person(111,124,{scale:.75,pose:'point'}),
  putBook:()=>room()+person(179,87,{pose:'point'})+table(376,216,.9)+book(340,178,.67,'#f4776c',false)+book(433,180,.5,'#75c8dc',false),
  home:()=>outdoors()+house(421,168,1)+person(269,132,{pose:'run',scale:.82})+path('M274 302Q360 273 430 255','none','#e9c999',45),
  grandmaWalk:()=>outdoors()+house(90,182,.64)+person(341,89,{kind:'grandma',color:C.pink,pose:'run'})+person(477,140,{pose:'open',scale:.7}),
  busStop:()=>outdoors()+rect(58,104,23,156,'#6a8e9d',4)+rect(32,77,78,55,'#fff',8,C.ink)+g(vehicle('bus',0,0,.18),71,106)+person(161,140,{scale:.7})+vehicle('bus',406,214,.9),
  busRide:()=>outdoors()+path('M0 267H600V320H0Z','#8a9ea8','none')+vehicle('bus',300,200,1.45)+circle(208,134,14,C.skin)+circle(272,134,14,C.skin)+circle(337,134,14,C.skin),
  carRide:()=>outdoors()+path('M0 267H600V320H0Z','#8a9ea8','none')+vehicle('car',300,217,1.3)+circle(338,183,14,C.skin),
  boatRide:()=>outdoors()+water(235)+person(297,115,{scale:.6})+vehicle('boat',300,232,1.4),
  crossing:()=>outdoors()+water(235)+bridge()+person(295,58,{scale:.65,pose:'run'})+flower(82,232,.8)+flower(527,238,.7,C.yellow),
  umbrella:()=>outdoors('cloud')+house(461,195,.67)+person(260,120,{scale:.9,pose:'hold'})+path('M173 113Q262-20 353 113Z',C.blue,C.ink,4)+path('M263 66v126q0 19-19 12','none',C.ink,5),
  friendsRead:()=>room()+person(179,87,{pose:'hold',color:C.blue})+person(308,90,{pose:'hold',kind:'girl',color:C.pink})+person(432,87,{pose:'hold',color:C.green})+book(302,188,1.3),
  sheepHill:()=>outdoors()+path('M65 286L296 70L530 286Z','#8dc99d',C.ink,2)+animal('sheep',290,120,.65)+animal('sheep',164,254,.65)+animal('sheep',423,254,.65),
  oneSheep:()=>outdoors()+animal('sheep',284,210,1.5)+tree(85,115,.7),
  twoSheep:()=>outdoors()+animal('sheep',170,220,1.15)+animal('sheep',409,220,1.15),
  playBall:()=>outdoors()+person(194,112,{pose:'dribble',color:C.blue})+ball(281,259,36)+person(420,102,{pose:'run',kind:'girl',color:C.pink})+path('M261 192q-22 29 1 44','none','#fff',5),
  jumping:()=>outdoors()+ellipse(300,283,47,10,'#46795540')+person(300,59,{pose:'open',color:C.green})+path('M230 219l-11 30M368 219l11 30','none','#53a9d4',5),
  invite:()=>room()+person(174,83,{pose:'point',color:C.green})+chair(400,155,1)+person(505,103,{scale:.85,kind:'girl',color:C.pink}),
  ballMine:()=>room()+person(288,80,{pose:'hold'})+ball(288,175,42)+book(455,245,.6,'#83d3d9',false),
  drawFlower:()=>room()+person(177,90,{pose:'reach'})+table(364,232)+rect(275,171,186,66,'#fff',7,C.ink)+g(flower(0,0,1),363,188,.48)+path('M207 159L261 173L298 187','none',C.skin,12)+pencil(295,197,.63),
  storytelling:()=>room()+person(198,48,{kind:'mom',pose:'hold',color:C.pink,scale:1.2})+book(198,168,.85)+person(401,134,{pose:'sit',scale:.85,color:C.green})+path('M274 78q30-13 44 10M275 96q22-9 33 8','none','#5db5d3',4),
  bookPages:()=>room()+table(300,247)+book(300,133,1.75)+[0,1,2].map(i=>rect(213+i*45,166,26,28,'#70bdd6',3)).join('')+person(91,165,{scale:.55,pose:'point'}),
  findBook:()=>room()+table(190,219,.72)+ball(187,179,30)+chair(421,145,.9)+book(421,169,.6,'#f4776c',false)+person(293,137,{scale:.7,pose:'point'}),
  rabbitGrass:()=>outdoors()+animal('rabbit',284,212,1.25)+path('M366 246l-10-34M366 246l18-43M366 246l41-14','none','#2c9764',8)+animal('bird',94,157,.7),
  birdWorm:()=>outdoors()+animal('bird',288,195,1.7)+path('M416 213q9-15 16 0t16 0t16 0','none','#ce9d72',9),
  dogFish:()=>outdoors()+animal('dog',162,217,1.2)+ellipse(426,248,115,51,'#86d9f1',C.ink)+animal('fish',429,245,.8),
  farm:()=>outdoors()+house(478,138,.7)+animal('cat',128,218,1)+animal('pig',356,222,1.1)+animal('chick',244,127,.65)+animal('duck',325,127,.65)+animal('goose',439,248,.72),
  catPig:()=>outdoors()+animal('cat',148,215,1.4)+animal('pig',424,216,1.4),
  fishPond:()=>outdoors()+ellipse(294,241,246,65,'#7dd4ec',C.ink)+animal('fish',218,228,.85)+animal('fish',395,256,.6)+path('M70 219l-6-43M78 223l15-51','none','#3aa879',7),
  nestTree:()=>outdoors()+tree(318,110,1.15)+line(322,178,447,144,C.wood,16)+ellipse(419,148,42,20,'#bd945f',C.ink)+animal('bird',413,124,.55)+animal('cat',283,205,.65),
  blackDog:()=>outdoors()+animal('dog',175,221,1.25,'#465461')+animal('horse',439,213,1.15)+ellipse(526,220,27,16,'#b37f51',C.ink)+path('M464 179l-8 22','none','#6a4a37',12),
  yellowBird:()=>outdoors()+tree(179,121,1)+animal('bird',350,158,1.3,C.yellow)+ellipse(303,178,40,20,'#47ab6a')+ellipse(335,183,40,20,'#5cbb77'),
  winter:()=>outdoors('cloud')+path('M0 246Q155 174 300 237T600 230V320H0Z','#fffefa','none')+tree(114,130,.85)+path('M57 124Q108 63 172 125Z','#fff','none')+[70,180,295,390,520].map((x,i)=>circle(x,55+i%2*70,7,'#fff')).join('')+person(405,117,{color:C.pink,pose:'open'}),
  spring:()=>outdoors()+flower(146,181,1.3)+flower(300,209,1,C.yellow)+flower(440,172,1.3,'#b991df')+tree(80,75,.5),
  autumn:()=>outdoors()+tree(302,87,1)+[100,170,250,360,440,510].map((x,i)=>ellipse(x,200+i%2*45,18,8,'#edba52')).join('')+path('M110 175q25 29 0 55','none','#cfab5c',3),
  stars:()=>outdoors('night')+[80,160,240,330,410,530].map((x,i)=>path(`M${x} ${35+i%2*65}l4 10 11 1-9 7 3 11-9-6-9 6 3-11-9-7 11-1Z`,'#fff2a7','none')).join('')+path('M0 246L94 140L220 246L383 158L530 270','#5f91a1','none')+person(279,124,{pose:'point',color:C.yellow}),
  thunder:()=>outdoors('rain')+cloud(270,65,2,'#829cae')+path('M326 83L283 150H319L291 205L368 123H328L355 83Z','#ffe484','none')+person(168,142,{pose:'face',emotion:'sad',scale:.75}),
  beach:()=>outdoors()+path('M0 196H600V320H0Z','#efd09b','none')+path('M360 150Q298 191 400 212Q474 234 405 275L600 320V145Z','#69c9e8','none')+path('M367 163Q320 191 414 216Q479 239 427 277','none','#fff',7)+[120,190,278].map((x,i)=>ellipse(x,249+i%2*29,26,14,'#a3b5bd',C.ink)).join('')+person(161,90,{scale:.75,pose:'point'}),
  wetTowel:()=>outdoors('rain')+line(130,95,455,95,C.wood,7)+line(136,65,136,275,C.wood,9)+line(449,65,449,275,C.wood,9)+towel(292,144,1.5)+[250,286,328].map(x=>path(`M${x} 241q-10 18 0 21q10-3 0-21`,'#56b6dc','none')).join('')+path('M40 150q40-20 68 0M40 175q40-20 68 0','none','#fff',5),
  seedling:()=>outdoors()+person(138,107,{pose:'point'})+rect(284,203,165,88,'#e3ccb0',9,C.ink)+line(366,139,366,224,'#43a776',8)+path('M366 177q-70-2-55-48q52-2 55 48M367 163q57-4 50-45q-44-4-50 45','#67bd7c',C.ink,2)+path('M366 223l-27 48M366 223l30 41M366 243l-2 35','none','#ac774c',5)+flower(513,204,.9,'#ee8079'),
  purpleCircle:()=>room()+table(300,249)+rect(165,65,270,186,'#fff',8,C.ink)+circle(300,158,75,'none','#41a9e2')+flower(300,136,.9,'#ad7ad1')+pencil(469,238,.85),
  redCircle:()=>room()+rect(165,65,270,186,'#fff',8,C.ink)+circle(300,158,75,'none','#ee7d77')+flower(300,136,.9,'#f7cf61'),
  bookTen:()=>room()+table(300,257)+Array.from({length:10},(_,i)=>book(115+(i%5)*92,103+Math.floor(i/5)*100,.65,i%2?'#75c8dc':'#f29987',false)).join(''),
  bookThree:()=>room()+table(300,257)+Array.from({length:3},(_,i)=>book(205+i*95,178,.65,i%2?'#75c8dc':'#f29987',false)).join(''),
  fourBalls:()=>outdoors()+[0,1,2,3].map(i=>ball(168+(i%2)*245,120+Math.floor(i/2)*120,40)).join(''),
  fiveBalls:()=>outdoors()+[0,1,2,3,4].map(i=>ball(100+i*100,180+(i%2)*60,33)).join(''),
  halfBread:()=>room()+table(300,235)+ellipse(300,231,100,27,'#fff',C.ink)+bread(300,196,1.35,true)+person(95,128,{scale:.65,pose:'point'}),
  wholeBread:()=>room()+table(300,235)+ellipse(300,231,100,27,'#fff',C.ink)+bread(300,196,1.35)+person(95,128,{scale:.65,pose:'point'}),
  tallDog:()=>outdoors()+animal('dog',175,183,1.5)+animal('cat',439,243,.65)+line(73,67,73,284,'#e7f9eb',5)+line(527,193,527,284,'#e7f9eb',5),
  tallCat:()=>outdoors()+animal('cat',439,183,1.5)+animal('dog',175,243,.65),
  comfort:()=>room(true)+cloud(465,53,.7,'#91a8bf')+path('M468 70l-12 20h14l-15 23l29-28h-13l12-15Z','#ffe17c','none')+person(217,58,{kind:'mom',color:C.pink,pose:'open',scale:1.2})+person(327,134,{emotion:'sad',pose:'hold',scale:.85}),
  bridgeSlow:()=>outdoors()+water(245)+bridge()+person(288,62,{scale:.65,pose:'walk'})+path('M270 175l-8 7M300 177l8 7','none','#c5905a',3),
  ballToDad:()=>outdoors()+person(204,120,{pose:'walkHold',scale:.85})+ball(204,204,27)+person(448,60,{kind:'dad',pose:'open',scale:1.18})+path('M248 271Q297 246 350 251','none','#e8d99d',16)+path('M335 238L351 251L333 263','none','#b68f46',6),
  dadRunning:()=>outdoors()+person(324,66,{kind:'dad',pose:'run',scale:1.2})+path('M185 166h53M173 192h47M180 218h43','none','#fff',7),
  hotSafe:()=>room()+table(445,193,.64)+cup(449,147,.76)+steam(450,128)+person(149,107,{pose:'open'})+path('M229 275H346','none','#fff',5),
  coldSafe:()=>room()+table(410,224,.7)+cup(407,177,.8)+person(266,100,{pose:'point'}),
  doctor:()=>room()+person(137,96,{kind:'mom',color:C.pink})+person(263,153,{emotion:'sad',scale:.7})+person(439,69,{color:'#fff',pose:'point',scale:1.1})+path('M419 133q-8 48 20 48q28 0 20-48','none','#5999b9',5)+circle(438,183,9,'#7facc3')+rect(403,54,73,22,'#fff',3,C.ink)+rect(430,57,18,16,'#54b697',2),
  medicineMom:()=>room()+person(290,65,{kind:'mom',color:C.pink,pose:'hold'})+rect(274,151,36,54,'#fff',5,C.ink)+rect(271,146,42,12,'#53b6a4',3)+circle(292,176,9,'#5dc4ad')+person(440,152,{scale:.6}),
  giveBook:()=>room()+person(177,104,{pose:'reach',color:C.green})+person(428,65,{pose:'receive',kind:'mom',color:C.pink,scale:1.17})+path('M203 180L258 202L282 198M398 171L356 200L328 198','none',C.skin,13)+book(302,177,.72,'#f29987',false)+table(78,259,.35)
 };
 const DATA=[
  [1,'哪幅图里有爸爸、妈妈和我？','family',['reading','oneSheep'],'爸爸、妈妈和孩子在家里'],
  [2,'早上起床后，我在做什么？','dressing',['sleeping','eating'],'孩子正在穿衣'],
  [3,'我吃饭了。哪幅图是吃饭？','eating',['reading','sleeping'],'孩子在餐桌前吃饭'],
  [4,'天晚了，我睡觉了。是哪幅图？','sleeping',['playBall','dressing'],'夜晚孩子在床上睡觉'],
  [5,'爷爷、奶奶在做什么？','elders',['milk','eating'],'爷爷和奶奶一起看书'],
  [6,'她爱看花。是哪幅图？','flowers',['reading','jumping'],'故事女孩正在看花'],
  [7,'我用毛巾洗脸。是哪幅图？','washFace',['brushTeeth','washHair'],'孩子用毛巾洗脸'],
  [8,'我洗干净上衣。是哪幅图？','laundry',['dirtyShirt','brushTeeth'],'孩子在盆里洗干净上衣'],
  [9,'我洗头发。是哪幅图？','washHair',['washFace','milk'],'孩子正在洗头发'],
  [10,'妈妈吃什么？','breadMom',['eggsDad','eating'],'妈妈吃面包'],
  [11,'我用什么吃饭？','spoon',['chopsticks','washDishes'],'孩子用勺子吃饭'],
  [12,'汤热了。是哪幅图？','hotSoup',['coldMilk','breadMom'],'碗里的热汤冒着热气'],
  [13,'我喝果汁。是哪幅图？','juice',['fruitBasket','drinking'],'孩子喝果汁'],
  [14,'我还要喝水。是哪幅图？','drinking',['eating','full'],'孩子拿着水杯喝水'],
  [15,'窗下有木桌。是哪幅图？','windowTable',['bedroom','bookChair'],'窗户下方放着木桌'],
  [16,'爸爸看电视。是哪幅图？','tvOn',['tvOff','lampOn'],'爸爸看着亮屏的电视'],
  [17,'这本书在我手里。是哪幅图？','bookHand',['bookTable','bookChair'],'孩子双手拿着书'],
  [18,'我看见了，书在哪里？','bookTable',['bookChair','bookHand'],'书放在桌面上'],
  [19,'我回家了。是哪幅图？','home',['boatRide','grandmaWalk'],'孩子走向家门'],
  [20,'我在哪里等车？','busStop',['boatRide','bookChair'],'孩子站在车站等公交车'],
  [21,'我在船上看水。是哪幅图？','boatRide',['busRide','carRide'],'孩子坐船看水'],
  [22,'我过桥。是哪幅图？','crossing',['boatRide','busStop'],'孩子从桥上走过'],
  [23,'我带什么出门？','umbrella',['ballMine','bookHand'],'孩子带伞出门'],
  [24,'我和朋友一起做什么？','friendsRead',['playBall','jumping'],'三个朋友一起看书'],
  [25,'一只羊在山上，两只羊在山下。是哪幅图？','sheepHill',['oneSheep','twoSheep'],'山上一只羊，山下两只羊'],
  [26,'我拍球，她跑来。是哪幅图？','playBall',['friendsRead','sleeping'],'一个孩子拍球，朋友跑过来'],
  [27,'我笑着说请坐。是哪幅图？','invite',['jumping','sleeping'],'孩子伸手邀请朋友坐椅子'],
  [28,'这是我的球。是哪幅图？','ballMine',['bookHand','milk'],'孩子拿着自己的球'],
  [29,'我用笔在纸上画什么？','drawFlower',['bookHand','ballMine'],'孩子用笔在纸上画花'],
  [30,'我听妈妈讲。是哪幅图？','storytelling',['sleeping','playBall'],'妈妈拿着书讲故事，孩子坐着听'],
  [31,'翻开故事书，哪幅图可以看到书页？','bookPages',['bookTable','ballMine'],'打开的故事书和书页'],
  [32,'哪幅图里的书在椅子上？','findBook',['ballMine','boatRide'],'书在椅子上，球在桌子上'],
  [33,'白兔在吃什么？','rabbitGrass',['birdWorm','dogFish'],'白兔在吃草'],
  [34,'小猫看着谁？','catPig',['dogFish','twoSheep'],'小猫看着小猪'],
  [35,'小鱼在哪里游？','fishPond',['nestTree','rabbitGrass'],'小鱼在池塘水里游'],
  [36,'鸟窝在树枝上。是哪幅图？','nestTree',['fishPond','beach'],'树枝上有鸟窝和小鸟'],
  [37,'黑狗毛短，小马尾毛长。是哪幅图？','blackDog',['yellowBird','twoSheep'],'黑狗有短毛，小马有长尾毛'],
  [38,'冬季有白雪。是哪幅图？','winter',['spring','autumn'],'冬季的地面和树上有白雪'],
  [39,'天空中有星光。是哪幅图？','stars',['thunder','spring'],'夜空中闪着星光'],
  [40,'海边沙里有小石头。是哪幅图？','beach',['nestTree','winter'],'海边沙地上有石头和海浪'],
  [41,'毛巾还是湿的。是哪幅图？','wetTowel',['bookTable','hotSoup'],'挂着的湿毛巾正在滴水'],
  [42,'小苗的根在哪里？','seedling',['flowers','fishPond'],'小苗的根在土里'],
  [43,'蓝色的圆里有紫色的花。是哪幅图？','purpleCircle',['redCircle','drawFlower'],'蓝色圆圈里面画着紫色的花'],
  [44,'我数了，是十本书。是哪幅图？','bookTen',['bookThree','fourBalls'],'两排共十本书'],
  [45,'这里有四个球。是哪幅图？','fourBalls',['fiveBalls','bookThree'],'画面中有四个球'],
  [46,'我吃了半个面包。哪幅图是半个？','halfBread',['wholeBread','hotSoup'],'盘子里是半个面包'],
  [47,'小狗比小猫高。是哪幅图？','tallDog',['tallCat','twoSheep'],'同一地面上的小狗比小猫高'],
  [48,'我怕雷声，妈妈陪着我。是哪幅图？','comfort',['playBall','sleeping'],'害怕的孩子身边有妈妈陪伴'],
  [49,'我慢慢走过小桥。是哪幅图？','bridgeSlow',['dadRunning','boatRide'],'孩子慢慢走过桥'],
  [50,'我拿着球去找爸爸。是哪幅图？','ballToDad',['dadRunning','bookHand'],'孩子拿着球走向爸爸'],
  [51,'别碰热水，我站远了。是哪幅图？','hotSafe',['coldSafe','eating'],'孩子站在远离热水杯的地方'],
  [52,'我生病了，妈妈带我去找谁？','doctor',['medicineMom','elders'],'妈妈陪着孩子找医生'],
  [53,'我送书给你。是哪幅图？','giveBook',['ballToDad','washDishes'],'孩子把书递给成人']
 ];
 scenes.bedroom=()=>room()+bed(300,208);
 const records=new Map(DATA.map(([id,question,correct,others,label])=>[id,{id,question,correct,others,label}]));
 function get(id){const n=Number(String(id).replace(/^.*?(\d+)$/,'$1'));const row=records.get(n);if(!row)throw new RangeError('Unknown story illustration: '+id);return row;}
 function svg(name,label){const draw=scenes[name];if(!draw)throw new RangeError('Missing scene: '+name);return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 320" role="img" aria-label="${esc(label)}" class="sprout-story-art"><title>${esc(label)}</title>${draw()}</svg>`;}
 function scene(id){const d=get(id);return svg(d.correct,d.label);}
 function choices(id){const d=get(id),variants=[d.correct,...d.others],correctIndex=d.id%3;return [0,1,2].map(i=>{const source=(i-correctIndex+3)%3;const option={key:'option-'+i,label:source===0?d.label:({bedroom:'房间里的床',bookChair:'椅子上放着书',reading:'孩子看书',oneSheep:'草地上一只羊',sleeping:'孩子在床上睡觉',eating:'孩子吃饭',playBall:'朋友玩球',dressing:'孩子穿衣',milk:'孩子喝奶',jumping:'孩子跳起来',brushTeeth:'孩子刷牙',washHair:'孩子洗头发',dirtyShirt:'有污点的上衣',washFace:'孩子洗脸',eggsDad:'爸爸吃蛋和菜',chopsticks:'爸爸用筷子吃菜',washDishes:'妈妈洗餐具',coldMilk:'凉牛奶',breadMom:'妈妈吃面包',fruitBasket:'水果篮',drinking:'孩子喝水',full:'孩子吃饱了',tvOff:'妈妈关掉电视',lampOn:'孩子开灯',bookTable:'书在桌上',bookHand:'孩子手里拿着书',boatRide:'孩子坐船',grandmaWalk:'奶奶走来',carRide:'爸爸开汽车',busRide:'乘坐公交车',busStop:'在车站等车',ballMine:'孩子拿着球',friendsRead:'朋友一起读书',twoSheep:'草地上两只羊',birdWorm:'小鸟吃小虫',dogFish:'小狗看小鱼',nestTree:'树枝上的鸟窝',rabbitGrass:'白兔吃草',fishPond:'池塘里的小鱼',beach:'海边沙石',yellowBird:'绿叶后的黄鸟',spring:'春天的花',autumn:'秋天的黄叶',thunder:'雷雨天空',winter:'冬天白雪',hotSoup:'热汤',flowers:'孩子看花',redCircle:'红色圆圈里的黄花',drawFlower:'在纸上画花',bookThree:'三本书',fourBalls:'四个球',fiveBalls:'五个球',wholeBread:'完整的面包',tallCat:'小猫比小狗高',dadRunning:'爸爸跑步',coldSafe:'孩子靠近普通水杯',medicineMom:'药在妈妈手里',elders:'爷爷奶奶看书',ballToDad:'孩子拿球找爸爸'}[variants[source]]||'另一幅生活场景'),svg:''};option.svg=svg(variants[source],option.label);return option;});}
 root.SproutStoryArt=Object.freeze({scene,choices,question:id=>get(id).question,answer:id=>'option-'+get(id).id%3,inventory:()=>DATA.map(([id,question,correct,others,label])=>({id,question,answer:'option-'+id%3,label,scene:correct,alternatives:[...others]}))});
})(globalThis);
