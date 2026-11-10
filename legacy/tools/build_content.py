import re,json,subprocess
s=open('content.src.js',encoding='utf-8').read()
s=re.sub(r"(?<=[oOgG])'",'ʻ',s)
s=re.sub(r"(?<=[A-Za-zʻ])'(?=[A-Za-z])",'ʼ',s)
assert "'" not in s, [m.start() for m in re.finditer("'",s)][:5]
open('content.js','w',encoding='utf-8').write(s)
# dump to json via node
j=subprocess.run(['node','-e',s+';console.log(JSON.stringify(CONTENT))'],capture_output=True,text=True,check=True).stdout
C=json.loads(j); json.dump(C,open('content.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
K=json.load(open('constitution.json',encoding='utf-8'))
A={a['n']:' '.join(a['text']) for s_ in K['sections'] for c in s_['chapters'] for a in c['articles']}
refs=[]
def walk(x,path):
    if isinstance(x,dict):
        for k,v in x.items():
            if k in('arts',) : refs.extend((path,n) for n in v)
            elif k=='art': refs.append((path,v))
            else: walk(v,path+'.'+k)
    elif isinstance(x,list):
        for i,v in enumerate(x): walk(v,f'{path}[{i}]')
walk(C,'C')
bad=[r for r in refs if r[1] not in A]; print('refs',len(refs),'bad',bad)
for sit in C['situations']:
    assert all(n in A for n in sit['q2']['o'])
print('quiz',len(C['quiz']),'blitz',len(C['blitz']),'situations',len(C['situations']),'sort',len(C['sort']))
