import json,sys
t=open(sys.argv[1],encoding='utf-8').read()
out={"title":"","preamble":[],"sections":[]}
sec=None;ch=None;arts=[]
for line in t.split('\n'):
    k,_,rest=line.partition('|')
    if k=='T': out['title']=rest
    elif k=='P': out['preamble']=rest.split('¶')
    elif k=='S': sec={"title":rest,"chapters":[]}; out['sections'].append(sec); ch=None
    elif k=='C': ch={"title":rest,"articles":[]}; sec['chapters'].append(ch)
    elif k=='A':
        n,anc,body,*note=rest.split('|')
        paras=[p for p in body.split('¶') if p!='Oldingi tahrirga qarang.']
        paras=[('24¹)'+p[4:]) if p.startswith('241)') else p for p in paras]
        notes=[x.replace('241-band','24¹-band') for x in note[0].split('¶')] if note else []
        a={"n":int(n),"anchor":anc,"text":paras}
        if notes: a["notes"]=notes
        if ch is None: ch={"title":"","articles":[]}; sec['chapters'].append(ch)
        ch['articles'].append(a); arts.append(a['n'])
assert arts==list(range(1,156)),arts
json.dump(out,open(sys.argv[2],'w',encoding='utf-8'),ensure_ascii=False,separators=(',',':'))
print('ok',len(arts),'sections',len(out['sections']),'chapters',sum(len(s['chapters']) for s in out['sections']))
