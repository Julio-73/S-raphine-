import "./fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/chrome.css";
import "./styles/sections.css";
import "./styles/motion.css";

import { initSmoothScroll } from "./lib/smooth";
import { initMotion } from "./lib/motion";
import { initNav } from "./lib/nav";
import { initGallery } from "./lib/gallery";
import { initCursor } from "./lib/cursor";
import { initJournal } from "./lib/journal";
import { initForms } from "./lib/form";
import { initCredits } from "./lib/credits";

document.documentElement.classList.add("js");

initSmoothScroll();
initMotion();
initNav();
initGallery();
initJournal();
initForms();
initCredits();
initCursor();
