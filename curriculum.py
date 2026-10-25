"""Original staged curriculum. Planned capacity is not published lesson content.

course.py is the frozen sprout-2 interpreter: never edit its task order or text.
"""
from copy import deepcopy
from course import DAYS, VERSION, lesson

PROGRESSIVE = 'sprout-3'
STAGES = [
    dict(id='life', title='生活词句', target=300, focus='换词换句，理解谁在做什么', status='partial'),
    dict(id='passages', title='连贯短文', target=800, focus='理解人物、地点和事件衔接', status='planned'),
    dict(id='stories', title='独立小故事', target=1500, focus='读新故事，复述主要经过', status='planned'),
    dict(id='topics', title='多主题阅读', target=2200, focus='跨题材找信息、说理由', status='planned'),
    dict(id='transfer', title='扩展与稳定', target=3000, focus='新文本迁移与延时保持', status='planned'),
]
# All texts are original, method-inspired rather than reproduced from a textbook.
ROWS = [
    ('小兔出门','兔门出来在',['小兔','出门','出来','来人','在家'],
     '小兔出门了。小兔在门口。来，小兔！','小兔出门。小兔在门口。',
     '小兔在哪里？',['门口','山上','水里'],'门口','兔 门 出 来 在','tù mén chū lái zài'),
    ('树上的小鸟','鸟树看见了',['小鸟','大树','看见','见面','来了'],
     '小兔看见了鸟。鸟在树上，小兔在树下。','小兔看见了鸟。鸟在树上。',
     '谁在树上？',['小兔','小鸟','小鱼'],'小鸟','鸟 树 看 见 了','niǎo shù kàn jiàn le'),
    ('河里的小鱼','河鱼游去里',['小河','小鱼','游来','回去','水里'],
     '小兔来到小河边。小鱼在河里游，游来游去。','小鱼在河里游。小鱼游来游去。',
     '小鱼在哪里游？',['河里','门口','树上'],'河里','河 鱼 游 去 里','hé yú yóu qù lǐ'),
    ('一起吃水果','果吃你我也',['水果','吃水果','你来','我来','也来'],
     '小兔说：“我吃水果。”小鸟说：“你吃，我也吃。”','我吃水果。你也吃水果。',
     '小兔说“我吃水果”，这里的“我”是谁？',['小兔','小鸟','小鱼'],'小兔','果 吃 你 我 也','guǒ chī nǐ wǒ yě'),
    ('拿伞回家','伞拿走回家',['雨伞','拿伞','走来','回家','家门'],
     '下雨了。小兔拿伞，走回家。小鸟说：“回家吧！”','下雨了。小兔拿伞回家。',
     '下雨了，小兔拿什么回家？',['水果','雨伞','小鱼'],'雨伞','伞 拿 走 回 家','sǎn ná zǒu huí jiā'),
    ('天晴朋友来','晴开朋友们',['天晴','开门','朋友','朋友','我们'],
     '天晴了，朋友们来了。小兔开门。小兔说：“我们一起看书吧！”','天晴了。朋友们来了。小兔开门。',
     '“朋友们来了”说的是谁来了？',['小兔的朋友','只有小兔','只有小鱼'],'小兔的朋友','晴 开 朋 友 们','qíng kāi péng yǒu men'),
    ('找书读书','书找读这本',['看书','找书','读书','这本','书本'],
     '小兔找来一本书。朋友们说：“读这本书吧！”小兔读，朋友们看。','找书。读这本书。朋友们看书。',
     '朋友们想做什么？',['拿伞出门','读这本书','去河里游'],'读这本书','书 找 读 这 本','shū zhǎo dú zhè běn'),
]

def _make_days():
    result=[]
    known={w['char'] for d in DAYS for w in d['words']}
    for n,(title,chars,words,story,reading,question,options,answer,_,pinyin) in enumerate(ROWS,1):
        known.update(chars)
        result.append(dict(day=n,id=f'journey-{n:02}',title=title,icon='🌱',stage_id='life',unit_id='rabbit-journey',
            prerequisite=f'journey-{n-1:02}' if n>1 else None,
            words=[dict(char=c,word=w,audio=None,character_id=f'char-{ord(c):x}',
                        reading=p,selection_evidence='生活场景、词句功能与原创故事需要',
                        review_status='editorial-draft',content_version=PROGRESSIVE,
                        first_introduced_lesson_id=f'journey-{n:02}') for c,w,p in zip(chars,words,pinyin.split())],
            sentences=[story,reading],story=story,independent_text=reading,
            support_characters=sorted({c for c in story+question+''.join(options) if '\u4e00'<=c<='\u9fff'}-known),
            question=question,options=options,answer=answer,review_status='editorial-draft',content_version=PROGRESSIVE))
    return result

NEW_DAYS=_make_days()
COURSES=[
    dict(id='foundation',version=VERSION,title='基础 35 字',area='foundation',stage_id='life',
         units=[dict(id='foundation-garden',title='原七课小花园',lesson_ids=[f'foundation-{n:02}' for n in range(1,8)])],
         days=[dict(d,id=f"foundation-{d['day']:02}",unit_id='foundation-garden',stage_id='life') for d in deepcopy(DAYS)]),
    dict(id='reading-journey',version=PROGRESSIVE,title='进阶 · 小兔的阅读之旅',area='progressive',stage_id='life',
         units=[dict(id='rabbit-journey',title='从出门到读书',lesson_ids=[d['id'] for d in NEW_DAYS])],days=NEW_DAYS),
]

def validate_catalog(courses):
    chars=set();versions=set();ids=set()
    for course in courses:
        if course['version'] in versions: raise ValueError('重复课程版本')
        versions.add(course['version'])
        for day in course['days']:
            if day['id'] in ids: raise ValueError('重复课 ID')
            ids.add(day['id'])
            for word in day['words']:
                char=word['char']
                if len(char)!=1 or not '\u4e00'<=char<='\u9fff' or char in chars: raise ValueError('字库目标字须全局唯一')
                chars.add(char)

def get_course(version):
    for course in COURSES:
        if course['version']==version: return deepcopy(course)
    raise ValueError('未知课程版本')

def tasks_for(version,day):
    course=get_course(version)
    if type(day)!=int or not 1<=day<=len(course['days']): raise ValueError('无效课程')
    if version==VERSION:
        return [dict(t,task_id=f'foundation-{day:02}:{i}',adult_prompt=t.get('text') or (t.get('char','')+'。'+t.get('word','')),
                     reading_mode='shared') for i,t in enumerate(lesson(day))]
    d=course['days'][day-1]; tasks=[]
    if day==1:
        tasks.append(dict(kind='warmup',title='小兔的阅读之旅',text='小兔要出门啦。可以请大人带读，也可以安静地看字和故事。'))
    else:
        previous=course['days'][day-2]['words']
        for i,w in enumerate(previous):
            opts=[previous[(i+j)%5]['char'] for j in range(3)]
            tasks.append(dict(kind='review',title='换一天，再见老朋友',char=w['char'],answer=w['char'],options=opts[i%3:]+opts[:i%3]))
    for w in d['words']: tasks.append(dict(kind='learn',title='汉字走进词语',**w))
    for i,w in enumerate(d['words']):
        opts=[d['words'][(i+j)%5]['char'] for j in range(3)]
        tasks.append(dict(kind='listen',title='大人读一读，找汉字',char=w['char'],answer=w['char'],options=opts[i%3:]+opts[:i%3]))
    # Filter by character, not rotating adjacent words: 我们/你们 would both match 们.
    pool=[w['word'] for c in COURSES for x in c['days'] for w in x['words']]
    for i,w in enumerate(d['words']):
        distractors=list(dict.fromkeys(o for o in pool if w['char'] not in o and o!=w['word']))[:2]
        opts=[w['word'],*distractors];shift=(i+1)%3
        tasks.append(dict(kind='match',title='哪个词语里有这个字？',char=w['char'],answer=w['word'],options=opts[shift:]+opts[:shift]))
    if day==3:
        tasks.append(dict(kind='component',title='发现一点小联系',text='河、游都有三点水。看看它们相同的部分，再看看不同的部分。这是观察字形，不是猜字源。'))
    if day==4:
        tasks.append(dict(kind='roleplay',title='换个角色说一说',text='大人指着自己说“我”，指着孩子说“你”；换孩子说一遍。说话的人换了，“我”和“你”指的人也换了。'))
    if day==6:
        tasks.append(dict(kind='roleplay',title='“们”让我们想到谁？',text='大人和孩子一起说“我们”。再请另一位朋友加入，说“朋友们”。不用固定图片猜“朋、友、们”，把它们放回句子里。'))
    tasks.append(dict(kind='sentence',title='大人和我一起读',text=d['story'],reading_mode='shared',support_characters=d['support_characters']))
    tasks.append(dict(kind='comprehension',title='故事里发生了什么？',text=d['question'],answer=d['answer'],options=d['options'],reading_mode='shared'))
    tasks.append(dict(kind='sentence',title='试着认一认短句',text=d['independent_text'],reading_mode='practice',
                      note='先看字，不看图；需要时请大人帮忙。这不是无提示认读检查。'))
    tasks.append(dict(kind='reward',title='每一次尝试都值得鼓励',text='今天的练习完成了。完成不等于掌握，改天再来读一读。'))
    for i,t in enumerate(tasks):
        t.update(task_id=f"{d['id']}:{i}",audio=None)
        t['adult_prompt']=t.get('text') or (t.get('char','')+'。'+t.get('word',''))
    return tasks

def catalog():
    validate_catalog(COURSES)
    courses=[dict(c,lessons={str(d['day']):tasks_for(c['version'],d['day']) for d in c['days']}) for c in deepcopy(COURSES)]
    return dict(courses=courses,stages=deepcopy(STAGES),planned_capacity=3000,
                published_characters=len({w['char'] for c in COURSES for d in c['days'] for w in d['words']}),
                audio=dict(available=False,modes=['adult','silent'],notice='自然音频尚未就绪，请选成人带读或静音练习；不计为自主认读。'))
