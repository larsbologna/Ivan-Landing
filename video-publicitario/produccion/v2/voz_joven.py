import sherpa_onnx, soundfile as sf, numpy as np, sys
L={"v1":"¿Tu negocio está perdiendo clientes sin que te des cuenta?","v2":"¿Te encuentran en Google... pero no te eligen?",
"v3":"¿Te escriben, y tardás en responder?","v4":"¿O perdés consultas por no tener un proceso simple?",
"v5":"Yo te ayudo a ordenar todo eso: Google, WhatsApp, tu web, y la forma en que tus clientes te contactan.",
"v6":"Ya ayudé a otros negocios. Puedo revisar el tuyo.","v7":"Solicitá un análisis gratuito."}
def kok():
    d="kokoro-multi-lang-v1_0"
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f"{d}/model.onnx",voices=f"{d}/voices.bin",tokens=f"{d}/tokens.txt",data_dir=f"{d}/espeak-ng-data",dict_dir=f"{d}/dict",lexicon=f"{d}/lexicon-us-en.txt",lang="es-419"),num_threads=4)))
def piper(name):
    d=f"vits-piper-{name}"
    return sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{d}/{name}.onnx",tokens=f"{d}/tokens.txt",data_dir=f"{d}/espeak-ng-data"),num_threads=4)))
V={"alex":(kok(),52),"ald":(piper("es_MX-ald-medium"),0),"claude":(piper("es_MX-claude-high"),0)}
for vn,(tts,sid) in V.items():
    tot=0; parts=[]
    for k,t in L.items():
        a=tts.generate(t,sid=sid,speed=1.0); x=np.array(a.samples); idx=np.where(np.abs(x)>0.01)[0]; x=x[max(0,idx[0]-200):idx[-1]+1500]
        sf.write(f"yv/{vn}_{k}.wav",x,a.sample_rate); tot+=len(x)/a.sample_rate
        parts.append(np.concatenate([x,np.zeros(int(0.4*a.sample_rate))]))
    sf.write(f"yv/{vn}_all.wav",np.concatenate(parts),a.sample_rate); print(vn,"total",round(tot,2))
