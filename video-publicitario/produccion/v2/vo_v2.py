import sherpa_onnx, soundfile as sf, numpy as np, sys
d="kokoro-multi-lang-v1_0"
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f"{d}/model.onnx",voices=f"{d}/voices.bin",tokens=f"{d}/tokens.txt",data_dir=f"{d}/espeak-ng-data",dict_dir=f"{d}/dict",lexicon=f"{d}/lexicon-us-en.txt",lang="es-419"),num_threads=2))
tts=sherpa_onnx.OfflineTts(cfg)
SP=float(sys.argv[1]) if len(sys.argv)>1 else 1.0
L={
"v1":"¿Tu negocio está perdiendo clientes sin que te des cuenta?",
"v2":"¿Te encuentran en Google, pero no te eligen?",
"v3":"¿Te escriben, y tardás en responder?",
"v4":"¿Perdés consultas por no tener un proceso simple?",
"v5":"Yo te ayudo a ordenar todo eso: Google, WhatsApp, tu web, y la forma en que tus clientes te contactan.",
"v6":"Ya ayudé a negocios a mejorar su presencia online. Puedo revisar el tuyo.",
"v7":"Solicitá un análisis gratuito.",
}
tot=0
for k,t in L.items():
    a=tts.generate(t,sid=53,speed=SP); x=np.array(a.samples); idx=np.where(np.abs(x)>0.01)[0]; x=x[max(0,idx[0]-200):idx[-1]+1500]
    sf.write(f"v2/{k}.wav",x,a.sample_rate); d_=len(x)/a.sample_rate; tot+=d_; print(k,round(d_,2))
print("total",round(tot,2))
