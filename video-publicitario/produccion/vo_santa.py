import sherpa_onnx, soundfile as sf, numpy as np, sys
d="kokoro-multi-lang-v1_0"
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f"{d}/model.onnx",voices=f"{d}/voices.bin",tokens=f"{d}/tokens.txt",data_dir=f"{d}/espeak-ng-data",dict_dir=f"{d}/dict",lexicon=f"{d}/lexicon-us-en.txt",lang="es-419"),num_threads=2))
tts=sherpa_onnx.OfflineTts(cfg)
lines={
 "l1":("Tu negocio aparece en Google... pero nadie te escribe.",1.05),
 "l2":("Fichas incompletas. Mensajes sin responder. Reservas que se pierden.",1.12),
 "l3":("Yo ordeno tu presencia online, para convertir más búsquedas en consultas y clientes.",1.1),
 "l4":("Soy... Iván Bologna. Pedime un análisis gratuito.",1.0),
}
out=sys.argv[1]
for k,(t,sp) in lines.items():
    a=tts.generate(t,sid=53,speed=sp); x=np.array(a.samples)
    idx=np.where(np.abs(x)>0.01)[0]; x=x[max(0,idx[0]-200):idx[-1]+2400]
    sf.write(f"{out}/{k}.wav",x,a.sample_rate); print(k,round(len(x)/a.sample_rate,2))
