import json,subprocess
subprocess.run(['python3','/home/claude/build_content.py'],check=True,cwd='/home/claude/src')
t=open('/home/claude/src/template.html',encoding='utf-8').read()
k=open('/home/claude/src/constitution.json',encoding='utf-8').read()
c=open('/home/claude/src/content.js',encoding='utf-8').read()
assert '/*__CONST__*/null' in t
t=t.replace('/*__CONST__*/null',k.replace('</','<\\/')).replace('/*__CONTENT__*/',c.replace('</','<\\/'))
open('/home/claude/out/index.html','w',encoding='utf-8').write(t)
print(len(t))
