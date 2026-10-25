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
 // Progressive teaching scenes. Function words are situated examples, not pictographic definitions.
 const feature=(name,shape)=>`<g class="${name}">${shape}</g>`;
 const fur=(x,y,rx,ry)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#faf7e9" stroke="#b9b59e" stroke-width="2"/>`;
 const rabbit=feature('rabbit',fur(157,136,13,13)+fur(120,134,39,30)+ellipse(101,155,23,10,'#e5dec9')+ellipse(143,155,23,10,'#e5dec9')+
  feature('rabbit-ears',fur(102,42,12,34)+fur(135,40,12,35)+ellipse(102,43,5,24,'#e7b5a6')+ellipse(135,41,5,25,'#e7b5a6'))+
  fur(119,88,39,34)+circle(105,82,4,ink)+circle(135,82,4,ink)+path('M114 96l6 5 6-5',rose,rose,3)+path('M120 102q-8 12-15 2M120 102q8 12 15 2','none',ink,3)+ellipse(91,99,8,5,'#edc8b8')+ellipse(149,99,8,5,'#edc8b8'));
 const bird=feature('bird',ellipse(112,106,54,34,blue)+circle(151,76,29,blue)+path('M175 76l24 9-25 9',gold,ink,2)+path('M60 106L32 82l8 39 29 6',blue,ink,3)+feature('bird-wing',path('M93 91q-19 34 34 32q13-22-34-32','#a2d4db',ink,3))+circle(159,70,4,ink)+path('M101 137v18m-9 0h17M133 137v18m-8 0h17','none',ink,3));
 const fish=feature('fish',feature('fish-tail',path('M63 87L29 59v60l34-23',gold,ink,3))+ellipse(122,88,64,35,'#efbc64')+path('M96 58l25-24 20 24',gold,ink,3)+path('M98 112l24 21 17-22',gold,ink,3)+circle(162,80,5,ink)+path('M178 94q-10 8-15 0','none',ink,3)+path('M132 66q-16 22 0 43','none','#c58e43',3));
 const house=feature('house',feature('house-roof',path('M37 77l83-58 83 58',soil,ink,4))+rect(53,76,134,87,'#f0deb4')+rect(111,108,37,55,'#a6bf96')+rect(68,92,28,29,'#c0e1e2')+path('M82 92v29M68 107h28','none',ink,2));
 const door=(open=false)=>feature('door-frame',rect(70,24,102,141,'#d2c5a2')+rect(80,31,82,134,'#496f60')+(open?feature('open-door',path('M84 36l53 18v105l-53 7Z','#e9c68a',ink,3)+circle(125,107,4,ink)):rect(84,36,74,129,'#e9c68a')+circle(144,107,4,ink)));
 const book=feature('book-pages',feature('open-book',path('M26 48q43-18 94 8q51-26 94-8v105q-46-18-94 6q-48-24-94-6Z','#fffaf0',ink,4)+path('M120 56v103M44 73q30-6 57 6M44 93q30-6 57 6M44 114q30-6 57 6M139 79q27-12 57-6M139 99q27-12 57-6M139 120q27-12 57-6','none','#91b4a0',3)));
 const closedBook=feature('closed-book',rect(68,24,108,137,blue,7)+rect(78,34,89,118,'#fbf7e8',3)+rect(78,34,7,118,rose,1)+path('M96 62h53M96 76h40M96 135h53','none','#a5b69b',3));
 const umbrella=feature('umbrella',feature('umbrella-canopy',path('M30 85Q120-22 210 85Q180 65 151 85Q120 65 89 85Q60 65 30 85Z',blue,ink,4)+path('M120 25Q91 41 89 85M120 25q30 20 31 60','none','#d7edf0',3))+path('M120 22v123q0 25-21 14','none',ink,5));
 const river=feature('river-bank',path('M20 28Q84 57 47 90T55 165H216Q166 122 204 82T183 20Z','#b7dfe0','none')+path('M80 51q31 16 73 0M79 118q33 17 76 0M108 149h47','none',blue,4));
 const fruit=feature('fruit-bowl',g(apple,13,5,.65)+g(apple,89,16,.6)+path('M36 113h168q-11 53-84 52q-73 1-84-52','#dfbf87',ink,3));
 const kid=(color=gold)=>circle(120,43,23,'#e3b891')+path('M100 29q18-22 39 0','none','#82684f',9)+circle(113,44,2,ink)+circle(128,44,2,ink)+path('M114 55q7 5 13 0','none',ink,2)+path('M120 122l-24 38M120 122l24 38','none',ink,8)+rect(99,73,42,52,color,10)+path('M100 83l-21 24M140 83l21 24','none','#bc9275',8);
 const speech=(x,y,shape)=>g(path('M0 0h60v36H25L12 49l1-13H0Z','#fffdf4','#91b4a0',2)+shape,x,y);
 const move=(name,d)=>feature(name,path(d,'none','#c68645',6));
 const openHouse=g(house,30,13,.9)+g(door(true),80,67,.56);
 const leaving=feature('direction-out',g(door(true),-43,4,.9)+g(rabbit,81,35,.72)+move('motion-arrow','M84 130h48m-10-10 10 10-10 10'));
 const approaching=feature('direction-toward',g(kid(leaf),106,37,.75)+g(rabbit,-28,45,.65)+move('motion-arrow','M87 81h54m-10-10 10 10-10 10'));
 const away=feature('direction-away',g(house,-22,53,.64)+g(rabbit,91,35,.72)+move('motion-arrow','M94 81h48m-10-10 10 10-10 10'));
 const atHome=feature('home-interior',g(house,-6,0,1.05)+rect(90,97,70,68,'#fbf7e8')+g(rabbit,86,102,.35));
 const treeBird=feature('tree-canopy',g(tree,12,10,.96)+g(bird,89,21,.42));
 const watching=feature('gaze-line',g(rabbit,-40,50,.66)+g(treeBird,80,0,.7)+path('M58 104l69-42','none','#c68645',3));
 const meeting=feature('meeting-pair',g(kid(leaf),-34,15,.86)+g(kid(blue),67,15,.86)+move('greeting','M101 92l19-18 19 18'));
 const arrival=feature('arrival-panels',rect(8,16,100,148,'#edf1dd',12)+rect(132,16,100,148,'#edf1dd',12)+g(door(true),-22,45,.56)+g(rabbit,-8,96,.34)+g(door(true),111,45,.56)+g(rabbit,119,61,.6)+move('time-arrow','M111 88h17m-6-6 6 6-6 6'));
 const swimming=feature('swim-trail',river+g(fish,36,53,.65)+move('motion-arrow','M72 35h75m-9-8 9 8-9 8')+path('M47 94H22M44 108H16','none',blue,3));
 const insideWater=feature('water-interior',river+g(fish,39,45,.62)+path('M186 50v88M178 50h8M178 138h8','none',ink,3));
 const eating=feature('eating-fruit',g(rabbit,-18,0,1)+g(apple,101,72,.3)+path('M130 129l8-12','none','#d8d1bd',9));
 const roles=(self)=>feature(self?'point-self':'point-other',g(kid(leaf),-38,33,.8)+g(kid(blue),75,33,.8)+speech(23,2,g(person,14,5,.15))+move('role-pointer',self?'M84 92l-14 12m-1-9 1 9 9-1':'M88 97h54m-9-8 9 8-9 8'));
 const same=feature('same-action',g(kid(leaf),-33,34,.78)+g(kid(blue),78,34,.78)+g(apple,41,91,.23)+g(apple,153,91,.23)+path('M112 49h20M112 58h20','none',ink,3));
 const holding=feature('holding-handle',g(rabbit,-37,31,.77)+g(umbrella,61,-2,.72)+path('M82 134l65-29','none','#d8d1bd',9)+circle(148,103,5,'#f5edda'));
 const walking=feature('walking-feet',g(rabbit,-2,-8,.9)+path('M79 143l-18 12M139 143l19-11','none',ink,5)+move('motion-arrow','M71 172h92m-9-7 9 7-9 7'));
 const goingHome=feature('direction-home',g(rabbit,-44,43,.67)+g(house,75,24,.74)+move('motion-arrow','M84 120h39m-9-8 9 8-9 8'));
 const clearSky=feature('clear-sky',g(sun,0,-5,.9)+g(cloud,116,58,.5)+path('M24 165q95-24 192 0','#d8e4be','none'));
 const opening=feature('open-door',g(door(true),57,0,1)+g(rabbit,-43,48,.68)+path('M72 134l67-26','none','#d8d1bd',8));
 const friends=feature('friend-pair',g(kid(leaf),-38,20,.85)+g(kid(blue),72,20,.85)+path('M101 110q18 15 38 0','none','#bc9275',7));
 const group=feature('group-together',g(kid(rose),-43,39,.7)+g(kid(gold),35,24,.8)+g(kid(blue),126,39,.7)+path('M26 165q94 20 188 0','none',leaf,4));
 const reading=feature('reading-voice',g(rabbit,-9,-11,.88)+g(book,56,91,.48)+path('M157 73l14-7M161 86h17M158 98l13 6','none',gold,4));
 const search=feature('search-shelf',rect(114,29,111,132,'#ddc6a0')+rect(122,37,95,50,'#f8f1db')+rect(122,96,95,57,'#f8f1db')+rect(132,45,14,39,blue)+rect(151,45,13,39,rose)+rect(171,46,13,38,leaf)+g(closedBook,143,103,.25)+g(rabbit,-48,48,.68)+path('M68 111l82-37','none','#c68645',3));
 const near=feature('point-near',g(closedBook,5,20,.9)+g(closedBook,156,5,.3)+move('near-pointer','M30 83h31m-8-7 8 7-8 7'));
 const counter=feature('book-counter',g(closedBook,7,0,1)+path('M65 175h124M65 169v6M189 169v6','none',ink,3));
 const progressive={
  '兔':[rabbit,'长耳朵、短尾巴的小兔'], '门':[door(),'有门框和把手的一扇门'], '出':[leaving,'小兔从打开的门向外走，箭头指向门外'],
  '来':[approaching,'小兔向招呼它的人走近，箭头指向说话的人'], '在':[atHome,'小兔在家里，房屋剖面展示它的位置'],
  '鸟':[bird,'有翅膀、尖嘴和细脚的小鸟'], '树':[feature('tree-canopy',tree),'有树干和绿色树冠的大树'], '看':[watching,'小兔抬头看树上的鸟，视线连接眼睛和小鸟'],
  '见':[meeting,'两个小朋友面对面见面、打招呼'], '了':[arrival,'先走近、后到了门口的两幅图；“来了”的变化语境，由大人讲解'],
  '河':[river,'两岸之间流动的小河'], '鱼':[fish,'有鱼鳍、鱼尾和鳞线的小鱼'], '游':[swimming,'小鱼在河水中游动，水纹和箭头表示游来'],
  '去':[away,'小兔离开原来的家向外走；“去”要结合说话人的位置'], '里':[insideWater,'小鱼在水里，蓝色水域包围小鱼'],
  '果':[fruit,'碗里装着有果柄和叶子的水果'], '吃':[eating,'小兔把水果举到嘴边吃'], '你':[roles(false),'说话的人指向对方，练习“你来”；换角色后“你”也改变'],
  '我':[roles(true),'说话的人指向自己，练习“我来”；换角色后“我”也改变'], '也':[same,'两个人同样拿起水果，表示“我吃，你也吃”的语境'],
  '伞':[umbrella,'有伞面、伞柄和弯把手的雨伞'], '拿':[holding,'小兔伸手握着伞柄拿伞'], '走':[walking,'小兔迈开脚向前走，箭头和脚步表示移动'],
  '回':[goingHome,'小兔沿箭头走回家，房屋是回去的目的地'], '家':[house,'有屋顶、窗户和家门的小房子'],
  '晴':[clearSky,'天晴了，太阳明亮，天空没有雨滴'], '开':[opening,'小兔伸手把门打开，能看见门后的空间'], '朋':[friends,'两个朋友牵手相伴；“朋”在“朋友”一词中理解'],
  '友':[friends,'两个朋友一起玩；“友”在“朋友”一词中理解'], '们':[group,'一群人在一起，表示“我们、朋友们”的语境，不靠固定角色猜字'],
  '书':[book,'展开的书，有书脊和左右两页'], '找':[search,'小兔看向书架，在几本书中找书'], '读':[g(reading,0,9),'小兔看着打开的书，嘴边的声音线表示读书'],
  '这':[near,'箭头指近处这本书，远处还有一本小书作对照；近指语境'], '本':[counter,'单独一本合上的书，下面括线圈定数量单位；“一本书”的语境'],
 };
 const vocabulary={
  '小兔':[rabbit,'长耳朵的小兔'], '出门':[leaving,'小兔从门里走到门外'], '出来':[leaving,'小兔向门外走出来'], '来人':[feature('direction-toward',g(kid(blue),-30,30,.78)+g(kid(leaf),106,30,.78)+move('motion-arrow','M88 90h48m-9-8 9 8-9 8')),'一个人向招呼他的人走近'], '在家':[atHome,'小兔待在家里'],
  '小鸟':[bird,'有翅膀和尖嘴的小鸟'], '大树':[feature('tree-canopy',extras.bigTree),'一大一小两棵树，展开的大树冠与小树对照'], '看见':[watching,'小兔的视线朝向树上的小鸟'], '见面':[meeting,'两个人面对面打招呼'], '来了':[arrival,'先走近、后到了门口的变化语境'],
  '小河':[river,'两岸之间流动的河水'], '小鱼':[fish,'有鱼鳍和尾巴的小鱼'], '游来':[swimming,'鱼沿箭头在水里游动'], '回去':[goingHome,'小兔沿箭头返回原来的家'], '水里':[insideWater,'鱼被蓝色水域包围'],
  '水果':[fruit,'碗里放着水果'], '吃水果':[eating,'小兔把水果举到嘴边'], '你来':[roles(false),'说话的人招呼对方；需要换角色练习'], '我来':[roles(true),'说话的人指向自己；需要换角色练习'], '也来':[feature('same-action',g(kid(leaf),108,25,.8)+g(rabbit,-32,5,.43)+g(rabbit,11,89,.43)+move('motion-arrow','M77 48h66m-7-6 7 6-7 6M111 139h32m-7-6 7 6-7 6')),'两个角色同样向招呼者走近，表示“也来”的语境'],
  '雨伞':[umbrella,'伞面遮雨，弯柄可以握住'], '拿伞':[holding,'小兔的手握住伞柄'], '走来':[g(walking,-30,20,.78)+g(kid(leaf),133,50,.62),'小兔迈开脚向招呼它的人走近'], '回家':[goingHome,'小兔走向房子的家门'], '家门':[g(house,-6,0,1)+g(door(),84,80,.5),'小房子的正面有家门'],
  '天晴':[clearSky,'有太阳、没有雨滴的天空'], '开门':[opening,'小兔伸手打开门'], '朋友':[friends,'两个伙伴牵手相伴，不固定指代某个角色'], '我们':[group,'一群人站在一起，说话人也在其中，需要换角色练习'],
  '看书':[g(g(rabbit,-9,-11,.88)+g(book,56,91,.48),0,9),'小兔眼睛朝向打开的书页'], '找书':[search,'小兔在书架上寻找书'], '读书':[g(reading,0,9),'看着书页，嘴边声音线表示读出声音'], '这本':[near,'手势指向近处的这本书，远处一本作为对照'], '书本':[closedBook,'带书脊、封面和成叠书页的一本书'],
 };
 const progressiveStories=[
  [
   [g(leaving,13,12,1)+g(approaching,331,12,1), '小兔出门了，来到门口；有人招呼“来，小兔”，箭头指向招呼者'],
   [g(leaving,5,13,1)+g(house,333,8,1)+g(rabbit,413,83,.5), '小兔从门内出门，随后在家门口；两幅场景对应两句话'],
  ],[
   [g(tree,230,-1,1.1)+g(bird,334,15,.42)+g(rabbit,215,70,.67)+feature('gaze-line',path('M305 125l82-67','none','#c68645',3)), '小兔看见了树上的小鸟；鸟在树上，小兔在树下看鸟'],
   [g(tree,230,-1,1.1)+g(bird,334,15,.42)+g(rabbit,210,70,.67)+feature('gaze-line',path('M300 125l87-67','none','#c68645',3)), '小兔看见了鸟；鸟停在树上，小兔抬头看'],
  ],[
   [g(river,258,-1,1.15)+g(fish,347,66,.65)+g(rabbit,56,42,.85)+move('swim-trail','M350 43h103m-10-9 10 9-10 9M455 158H352m10-9-10 9 10 9'), '小兔来到河边，看小鱼在河里游，箭头表示游来游去'],
   [g(river,171,-5,1.25)+g(fish,225,53,.9)+move('swim-trail','M254 38h111m-10-9 10 9-10 9M369 161H258m10-9-10 9 10 9'), '小鱼在河里游，两个相反方向的箭头表示游来游去'],
  ],[
   [g(eating,39,28,.9)+g(bird,319,44,.85)+g(apple,420,114,.3)+speech(170,13,g(apple,15,1,.21))+speech(378,10,g(apple,15,1,.21)), '小兔说“我吃水果”，小鸟回应“你吃，我也吃”；双方都拿水果，需成人交换说话角色'],
   [g(same,121,-6,1.15)+g(fruit,399,61,.55), '两个角色都吃水果，对应“我吃水果，你也吃水果”；我和你随说话角色改变'],
  ],[
   [g(rain,-14,-11,.72)+g(holding,133,24,.9)+g(house,378,17,.94)+g(bird,13,89,.49)+move('direction-home','M309 151h78m-9-8 9 8-9 8'), '下雨了，小兔拿伞走回家，小鸟在后面招呼“回家吧”'],
   [g(rain,3,-14,.75)+g(holding,141,24,.9)+g(house,379,17,.94)+move('direction-home','M312 151h75m-9-8 9 8-9 8'), '下雨了，小兔握着雨伞，沿箭头走回家'],
  ],[
   [g(sun,3,-5,.65)+g(group,9,49,.7)+g(opening,261,13,1)+g(book,462,108,.48), '天晴了，朋友们来了，小兔开门迎接，邀请我们一起看书'],
   [g(sun,3,-5,.65)+g(group,9,49,.7)+g(opening,289,13,1), '天晴了，朋友们来到门前，小兔打开门迎接'],
  ],[
   [g(search,3,15,.95)+g(reading,255,13,.95)+g(group,454,63,.6)+move('near-pointer','M470 143h-24m8-7-8 7 8 7'), '小兔从书架找来一本书，朋友指着这本书，请小兔读，朋友们看'],
   [g(search,1,15,.95)+g(near,235,55,.55)+g(reading,351,22,.85)+g(group,473,79,.48), '先找书，再读这本书；小兔读，朋友们一起看书'],
  ],
 ];
 function progressiveStory(day,index){
  const entry=progressiveStories[day-1]?.[index];
  if(!entry)throw new RangeError('No progressive teaching scene for this lesson');
  return svg(rect(0,0,600,200,'#e9f2e4',20)+path('M0 167Q150 145 300 169T600 158V200H0Z','#d8e4be','none')+entry[0],entry[1],'0 0 600 200','story-art',`data-scene="sprout-3-${day}-${index}"`);
 }

 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function svg(shape,label,view='0 0 240 180',className='character-art',attributes=''){return `<svg ${attributes?attributes+' ':''}class="${className}" xmlns="http://www.w3.org/2000/svg" viewBox="${view}" role="img" aria-label="${safe(label)}"><title>${safe(label)}</title>${shape}</svg>`;}
 function character(char){const entry=progressive[char];return entry?svg(entry[0],entry[1],'0 0 240 180','character-art',`data-character="${safe(char)}"`):svg(shapes[char]||tree,labels[char]||'一棵小树');}
 function word(word,char){const entry=vocabulary[word];if(entry)return svg(entry[0],word+'：'+entry[1],'0 0 240 180','character-art',`data-word="${safe(word)}"`);const key=words[word]||char;return svg(extras[key]||shapes[key]||tree,word+'的配图');}
 function mascot(kind='listen'){
  const expression=kind==='success'?path('M99 111q21 24 42 0','none',ink,5):kind==='try'?path('M102 117q18-12 36 0','none',ink,4):path('M104 114q16 15 32 0','none',ink,4);
  const body=ellipse(120,113,52,43,'#d2dcb1')+path('M121 75V43','none',ink,5)+path('M121 57Q82 55 88 28Q119 28 121 57M122 48Q149 46 151 21Q123 24 122 48',leaf,ink,3)+circle(102,102,4,ink)+circle(139,102,4,ink)+expression+ellipse(87,115,8,4,'#e9b49b')+ellipse(154,115,8,4,'#e9b49b');
  const detail=kind==='listen'?path('M63 101v-9a57 57 0 0 1 114 0v9','none',blue,7)+rect(55,94,15,30,blue)+rect(170,94,15,30,blue):kind==='success'?path('M183 78l12 12 22-30','none','#528663',8):path('M190 79q17-21 29 0q8 11-10 21v8','none','#c38c50',5)+circle(208,121,3,'#c38c50');
  return svg(body+detail,kind==='success'?'小芽笑着鼓励你':kind==='try'?'小芽陪你再想一想':'小芽戴着耳机认真听声音','0 0 240 180','sprout-mascot');
 }
 function story(day,index=0,version='sprout-2'){
  if(version==='sprout-3')return progressiveStory(day,index);
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
