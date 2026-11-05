---
title: Devlog 2
date: 2026-11-05
tags: Provocotype, Field Testing
type: 
tools:
status: DONE
cover: media/your-cover.png
highlight: Devlog 2
read: 5 min
---

Wij hebben voor het eerst ons provocotype kunnen testen tijdens het Society 5.0 Festival. <br>
Tijdens het Society 5.0 Festival hebben wij meerdere mensen kunnen vragen om ons product te testen. Uit de tests bleek dat mensen nog wisselende gevoelens hadden over ons provocotype. <br><br>

Hoewel wij geen bewijs hebben kunnen krijgen of ons provocotype goed werkt of niet, hebben wij wel duidelijke signalen gekregen dat wij de juiste richting op gaan.

![Ons provocotype Teddy](media/Teddy.jpg)

Ik heb ook tips gekregen over hoe wij een speaker, een microfoon en een lokaal Text-to-Speech- (TTS) en Speech-to-Text-model (STT) in Teddy kunnen krijgen. <br>
Wij hebben ook wat tips gekregen over meer directe feedback naar de gebruiker via een scherm dat bijvoorbeeld een pictogram met emoties toont.

![Een Raspberry Pi 5 en een ESP32 ter illustratie van hoe het in de teddybeer kan zitten](media/Pi5-ESP.jpg)

Ik ben al aan het kijken welke lichtgewicht modellen kunnen draaien op een simpele ESP32, zoals [PicoTTS](https://github.com/DiUS/esp-picotts) voor het uitspreken van de tekst, zodat Teddy daadwerkelijk lokaal tegen je kan praten. <br>
Wel denk ik dat dit model beter gebruikt kan worden wanneer Teddy heel dark wordt, omdat de kwaliteit van de gesproken berichten niet heel goed is. <br>

Hier is een link naar hoe de tekst uit de module klinkt: [https://www.youtube.com/watch?v=1Pyzs4tlaEk](https://www.youtube.com/watch?v=1Pyzs4tlaEk)

Ook heb ik op GitHub een STT + TTS-model gevonden genaamd [babytalk](https://github.com/tlack/babytalk). Het ziet er deels veelbelovend uit, alleen durf ik het met de gen-AI-foto's erin niet te zeggen. Ook heb je een ESP32-S3 N16R8 nodig om alles erop te krijgen.

Hier is de rest van de foto's van het Society 5.0 Festival:

![Hoe een JBL-speaker in Teddy is gezet](media/Speaker.jpg)
![Een kartonnen mock-up](media/Carton-Teddy.jpg)

---
