import { Config } from "@remotion/cli/config";
// 3D (WebGL) přes ANGLE. Prohlížeč si Remotion stáhne sám (Chrome Headless Shell).
// Chceš-li použít nainstalovaný Chrome: Config.setBrowserExecutable("cesta/k/chrome")
Config.setChromiumOpenGlRenderer("angle");
