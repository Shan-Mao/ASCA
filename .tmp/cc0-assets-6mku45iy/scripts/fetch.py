import sys, pathlib, tempfile, subprocess, json, re
BASE = pathlib.Path(__file__).resolve().parent.parent

def fetch(url, label):
    folder = pathlib.Path(tempfile.mkdtemp(prefix=label+'-', dir=BASE))
    target = folder/'response'
    result = subprocess.run(['curl','--ssl-no-revoke','-L','--max-time','50','--retry','1','-sS','-D',str(folder/'headers.txt'),'-o',str(target),'-w','%{http_code}\n%{url_effective}\n%{content_type}',url],capture_output=True,text=True)
    (folder/'request.json').write_text(json.dumps({'url':url,'curl_exit':result.returncode,'result':result.stdout,'stderr':result.stderr},indent=2),encoding='utf-8')
    print(json.dumps({'dir':str(folder),'status':result.stdout,'error':result.stderr,'bytes':target.stat().st_size if target.exists() else 0}),flush=True)
    return target

if __name__=='__main__':
    p=fetch(sys.argv[1],sys.argv[2])
    if len(sys.argv)>3:
        text=p.read_text(encoding='utf-8',errors='replace')
        if sys.argv[3]=='links':
            for s in re.findall(r'.{0,180}(?:CC0|Public Domain|public domain|creativecommons|2032141|\.svg|\.jpg).{0,220}',text): print(s)
        elif sys.argv[3]=='json': print(text)
