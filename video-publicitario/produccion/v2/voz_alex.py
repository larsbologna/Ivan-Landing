# Locución v2: Kokoro, voz em_alex (ID 29 en kokoro-multi-lang-v1_0), español latino, velocidad natural.
import sherpa_onnx, soundfile as sf, numpy as np
d = "kokoro-multi-lang-v1_0"
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f"{d}/model.onnx", voices=f"{d}/voices.bin", tokens=f"{d}/tokens.txt",
                                                   data_dir=f"{d}/espeak-ng-data", dict_dir=f"{d}/dict",
                                                   lexicon=f"{d}/lexicon-us-en.txt", lang="es-419"), num_threads=4)))
L = {"v1": "¿Tu negocio está perdiendo clientes sin que te des cuenta?", "v2": "¿Te encuentran en Google... pero no te eligen?",
     "v3": "¿Te escriben, y tardás en responder?", "v4": "¿O perdés consultas por no tener un proceso simple?",
     "v5": "Yo te ayudo a ordenar todo eso: Google, WhatsApp, tu web, y la forma en que tus clientes te contactan.",
     "v6": "Ya ayudé a otros negocios. Puedo revisar el tuyo.", "v7": "Solicitá un análisis gratuito."}
for k, t in L.items():
    a = tts.generate(t, sid=29, speed=1.0); x = np.array(a.samples); idx = np.where(np.abs(x) > 0.01)[0]
    sf.write(f"{k}.wav", x[max(0, idx[0] - 200):idx[-1] + 1500], a.sample_rate)
