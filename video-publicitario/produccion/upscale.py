# Real-ESRGAN x2plus (RRDBNet) en CPU, por mosaicos.
import torch, torch.nn as nn, torch.nn.functional as F, numpy as np, sys
from PIL import Image

class RDB(nn.Module):
    def __init__(s, nf=64, gc=32):
        super().__init__()
        s.conv1 = nn.Conv2d(nf, gc, 3, 1, 1); s.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        s.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1); s.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        s.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1); s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        x1 = s.l(s.conv1(x)); x2 = s.l(s.conv2(torch.cat((x, x1), 1)))
        x3 = s.l(s.conv3(torch.cat((x, x1, x2), 1))); x4 = s.l(s.conv4(torch.cat((x, x1, x2, x3), 1)))
        return s.conv5(torch.cat((x, x1, x2, x3, x4), 1)) * 0.2 + x

class RRDB(nn.Module):
    def __init__(s, nf=64, gc=32):
        super().__init__(); s.rdb1 = RDB(nf, gc); s.rdb2 = RDB(nf, gc); s.rdb3 = RDB(nf, gc)
    def forward(s, x):
        return s.rdb3(s.rdb2(s.rdb1(x))) * 0.2 + x

class RRDBNet(nn.Module):
    def __init__(s, nb=23, nf=64):
        super().__init__()
        s.conv_first = nn.Conv2d(12, nf, 3, 1, 1)
        s.body = nn.Sequential(*[RRDB(nf) for _ in range(nb)])
        s.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        s.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
        s.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1); s.conv_last = nn.Conv2d(nf, 3, 3, 1, 1)
        s.l = nn.LeakyReLU(0.2, True)
    def forward(s, x):
        x = F.pixel_unshuffle(x, 2)
        f = s.conv_first(x); f = f + s.conv_body(s.body(f))
        f = s.l(s.conv_up1(F.interpolate(f, scale_factor=2, mode="nearest")))
        f = s.l(s.conv_up2(F.interpolate(f, scale_factor=2, mode="nearest")))
        return s.conv_last(s.l(s.conv_hr(f)))

torch.set_num_threads(4)
net = RRDBNet()
sd = torch.load(sys.argv[1], map_location="cpu")
net.load_state_dict(sd.get("params_ema", sd)); net.eval()
TILE, PAD = 256, 16
for src in sys.argv[2:]:
    img = np.asarray(Image.open(src).convert("RGB")).astype(np.float32) / 255
    x = torch.from_numpy(img).permute(2, 0, 1)[None]
    _, _, H, W = x.shape
    out = torch.zeros(1, 3, H * 2, W * 2)
    with torch.no_grad(), torch.autocast("cpu", dtype=torch.bfloat16):
        for y0 in range(0, H, TILE):
            for x0 in range(0, W, TILE):
                ya, xa = max(0, y0 - PAD), max(0, x0 - PAD)
                yb, xb = min(H, y0 + TILE + PAD), min(W, x0 + TILE + PAD)
                o = net(x[:, :, ya:yb, xa:xb]).float()
                th, tw = min(TILE, H - y0), min(TILE, W - x0)
                out[:, :, y0 * 2:(y0 + th) * 2, x0 * 2:(x0 + tw) * 2] = o[:, :, (y0 - ya) * 2:(y0 - ya + th) * 2, (x0 - xa) * 2:(x0 - xa + tw) * 2]
    o = (out[0].clamp(0, 1).permute(1, 2, 0).numpy() * 255).round().astype(np.uint8)
    Image.fromarray(o).save(src.replace(".png", "_2x.png"))
    print("up", src, flush=True)
