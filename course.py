"""Original seven-day family curriculum. No external textbook content."""
VERSION='sprout-2'
DATA=[
 ('阳光小院','日月山水火',['日光','月亮','大山','河水','火苗'],['太阳照着小院，水面亮亮的。','月亮出来了，小山安静了。'],'☀️'),
 ('森林散步','木林森大小',['木头','树林','森林','大树','小草'],['小树长大了，许多树连成树林。','森林里有大树，也有小树。'],'🌳'),
 ('我的身体','人口手足目',['人们','开口','小手','手足','目光'],['我张开小手，向你问好。','用目光找一找，小手在哪里？'],'🖐️'),
 ('田野朋友','田土牛羊马',['田地','泥土','小牛','山羊','小马'],['小牛在田边，山羊在山上。','小马走过田地，足下是软软的土。'],'🌾'),
 ('天空来信','天云雨风雪',['天空','白云','雨水','大风','雪花'],['天上有白云，风轻轻地吹。','雨水落下来，雪花也想来做客。'],'☁️'),
 ('花园颜色','花草叶红白',['小花','小草','树叶','红花','白云'],['红花旁边有小草，树上长着叶。','白云飘过花园，花草点点头。'],'🌸'),
 ('一起出发','上下中左右',['上山','下山','中间','左手','右手'],['左手和右手一起拍一拍。','小山在中间，白云在上面，花草在下面。'],'🌈')]
DAYS=[]
for n,(title,chars,words,sentences,icon) in enumerate(DATA,1):
 DAYS.append(dict(day=n,title=title,icon=icon,words=[dict(char=c,word=w,audio=f'w{n}-{i}') for i,(c,w) in enumerate(zip(chars,words))],sentences=sentences))
def lesson(day):
 if type(day)!=int or not 1<=day<=7:raise ValueError('无效课程')
 d=DAYS[day-1];tasks=[]
 if day==1:tasks.append(dict(kind='warmup',title='一起去小院找汉字',text='先听一听，再看一看。随时可以休息。',audio='welcome'))
 else:
  for i,w in enumerate(DAYS[day-2]['words']):
   opts=[DAYS[day-2]['words'][(i+j)%5]['char'] for j in range(3)];opts=opts[i%3:]+opts[:i%3]
   tasks.append(dict(kind='review',title='老朋友，你还认得吗？',char=w['char'],audio=w['audio']+'-char',answer=w['char'],options=opts))
 for w in d['words']:tasks.append(dict(kind='learn',title='认识一个新朋友',**w))
 for i,w in enumerate(d['words']):
  opts=[d['words'][(i+j)%5]['char'] for j in range(3)];opts=opts[i%3:]+opts[:i%3]
  tasks.append(dict(kind='listen',title='听声音，找汉字',char=w['char'],audio=w['audio']+'-char',answer=w['char'],options=opts))
 for i,w in enumerate(d['words']):
  opts=[d['words'][(i+j)%5]['word'] for j in range(3)];opts=opts[(i+1)%3:]+opts[:(i+1)%3]
  tasks.append(dict(kind='match',title='给汉字找词语朋友',char=w['char'],audio=w['audio']+'-char',answer=w['word'],options=opts))
 for i,s in enumerate(d['sentences']):tasks.append(dict(kind='sentence',title='汉字住进小故事',text=s,audio=f's{day}-{i}'))
 tasks.append(dict(kind='reward',title='今天的花朵送给你',text='每一次认真尝试，都在慢慢长大。',audio='reward'))
 return tasks
def audio_texts():
 texts={'welcome':'一起去小院找汉字。先听一听，再看一看。随时可以休息。','reward':'今天的花朵送给你。每一次认真尝试，都在慢慢长大。'}
 for d in DAYS:
  for w in d['words']:
   texts[w['audio']]=w['char']+'。'+w['word']+'。';texts[w['audio']+'-char']=w['char']+'。'
  for i,s in enumerate(d['sentences']):texts[f"s{d['day']}-{i}"]=s
 return texts
