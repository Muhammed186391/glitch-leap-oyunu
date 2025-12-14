// =======================================================
// A. CANVAS VE TEMEL AYARLAR
// =======================================================
const canvas = document.getElementById('oyunAlani');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 450;

// Oyun Sabitleri
const YER_CEKIMI = 0.5;
const ZIPLAMA_KUVVETI = -12; 
const VURUS_GERI_TEPME_KUVVETI = -8; 
const TEMEL_YURUME_HIZI = 5; 
let YURUME_HIZI = TEMEL_YURUME_HIZI; 
const ZEMIN_Y = 400; 
const BASLANGIC_X = 50; 
const YENIDEN_BASLATMA_YAZISI = "OYUN BİTTİ - Yeniden Başlatmak için R'ye Basın";
const ODA_GENISLIGI = 800;
const ODA_YUKSEKLIGI = 450;

// Güçlendirme Sabitleri
const HIZ_GUCLENDIRMESI_SURESI = 5000; 
const GUCLENDIRME_BOYUT = 20;

// =======================================================
// B. NESNE VE DURUM TANIMLARI
// =======================================================

let oyunBittiMi = false; 
let mevcutOda = 1;
let maksimumOda = 0; 
let hizlanmaBittiZamani = 0; 
let sonAtisZamani = 0; 
const ATIS_COOLDOWN = 500; 

// Glitch Nesnesi
const glitch = {
    x: BASLANGIC_X,
    y: ZEMIN_Y,
    genislik: 30,
    yukseklik: 30,
    renk: '#ff00ff',
    hiz_x: 0, 
    hiz_y: 0, 
    yerdeMi: true,
    ziplamaHakki: 2, 
    can: 3 
};

// Diğer Nesneler 
let dusmanlar = []; 
let platformlar = [];
let powerUps = []; 
let mermiler = []; 

// =======================================================
// YEREL SKOR MANTIĞI
// =======================================================

function skoruYereldenYukle() {
    const kayitliSkor = localStorage.getItem('glitchMaxOda');
    if (kayitliSkor) {
        maksimumOda = parseInt(kayitliSkor, 10);
        console.log("Kaydedilen Maksimum Oda Yüklendi: " + maksimumOda);
    } else {
        maksimumOda = 0;
    }
}

function skoruYerelKaydet(yeniSkor) {
    if (yeniSkor > maksimumOda) {
        maksimumOda = yeniSkor;
        localStorage.setItem('glitchMaxOda', maksimumOda);
        console.log("Yeni Maksimum Skor Kaydedildi: " + maksimumOda);
    }
}


// =======================================================
// C. KLAVYE KONTROLLERİ VE HAREKET
// =======================================================
const tuslar = {};

document.addEventListener('keydown', (e) => {
    tuslar[e.code] = true;

    if (e.code === 'Space' && glitch.ziplamaHakki > 0 && !oyunBittiMi) {
        glitch.hiz_y = ZIPLAMA_KUVVETI; 
        glitch.yerdeMi = false;
        glitch.ziplamaHakki--; 

        if (glitch.ziplamaHakki === 1) {
             glitch.renk = '#00ffff'; 
        }
    }

    if (oyunBittiMi && e.code === 'KeyR') {
        yenidenBaslat();
    }
    
    // Mermi Atışı Kontrolü (F tuşu)
    if (e.code === 'KeyF' && !oyunBittiMi) {
        // Cooldown süresi doldu mu?
        if (Date.now() > sonAtisZamani + ATIS_COOLDOWN) {
            mermiFirlat();
            sonAtisZamani = Date.now(); // Son atış zamanını güncelle
        }
    }
});

document.addEventListener('keyup', (e) => {
    tuslar[e.code] = false;
});


function yatayHareket() {
    glitch.hiz_x = 0;
    
    if (tuslar['ArrowRight'] || tuslar['KeyD']) {
        glitch.hiz_x = YURUME_HIZI; 
    } else if (tuslar['ArrowLeft'] || tuslar['KeyA']) {
        glitch.hiz_x = -YURUME_HIZI;
    }
    
    glitch.x += glitch.hiz_x;

    if (glitch.x < 0) glitch.x = 0;
    if (glitch.x + glitch.genislik > canvas.width) glitch.x = canvas.width - glitch.genislik;
}

function mermiFirlat() {
    const yon = glitch.hiz_x >= 0 ? 1 : -1;
    const mermiHiz = 10 * yon;
    
    const mermiX = glitch.x + glitch.genislik / 2 - 5; 
    const mermiY = glitch.y + glitch.yukseklik / 2 - 5;

    mermiler.push({
        x: mermiX,
        y: mermiY,
        genislik: 10,
        yukseklik: 10,
        hiz_x: mermiHiz,
        hiz_y: 0,
        renk: '#ffea00', 
        tehlikeli: false // Oyuncunun mermisi
    });
}


// =======================================================
// D. FİZİK VE GÜNCELLEME MANTIĞI
// =======================================================

function guncelle() {
    yatayHareket();

    // 1. Yerçekimini Uygulama (Glitch)
    glitch.hiz_y += YER_CEKIMI;
    glitch.y += glitch.hiz_y;

    // 2. Platform Çarpışma Kontrolü (Glitch)
    let yerdeKalmaDurumu = false;
    glitch.yerdeMi = false;
    
    platformlar.forEach(p => {
        if (
            glitch.x < p.x + p.genislik &&
            glitch.x + glitch.genislik > p.x &&
            glitch.y + glitch.yukseklik < p.y + 10 && 
            glitch.y + glitch.yukseklik + glitch.hiz_y >= p.y
        ) {
            glitch.y = p.y - glitch.yukseklik;
            glitch.hiz_y = 0;
            yerdeKalmaDurumu = true;
        }
    });

    if (yerdeKalmaDurumu) {
        glitch.yerdeMi = true;
        glitch.ziplamaHakki = 2;
        glitch.renk = '#ff00ff'; 
    }
    
    if (!glitch.yerdeMi && glitch.ziplamaHakki === 1) {
        glitch.renk = '#00ffff';
    }
    
    // Canvas dışına düşme kontrolü (En alt zemin)
    if (glitch.y > ZEMIN_Y) {
         glitch.y = ZEMIN_Y;
         glitch.hiz_y = 0;
         glitch.yerdeMi = true;
         glitch.ziplamaHakki = 2;
         glitch.renk = '#ff00ff'; 
    }

    // 3. Güçlendirme Çarpışma Kontrolü
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const pu = powerUps[i];
        if (
            glitch.x < pu.x + pu.genislik &&
            glitch.x + glitch.genislik > pu.x &&
            glitch.y < pu.y + pu.yukseklik &&
            glitch.y + glitch.yukseklik > pu.y
        ) {
            // Güçlendirme alındı
            if (pu.tip === 'can') {
                glitch.can = Math.min(glitch.can + 1, 5); 
                console.log("Can Güçlendirmesi alındı! Kalan Can: " + glitch.can);
            } else if (pu.tip === 'hiz') {
                YURUME_HIZI = TEMEL_YURUME_HIZI * 1.8; 
                hizlanmaBittiZamani = Date.now() + HIZ_GUCLENDIRMESI_SURESI;
                console.log("Hız Güçlendirmesi alındı!");
            }
            
            // Güçlendirmeyi diziden kaldır
            powerUps.splice(i, 1);
        }
    }

    // 4. Hız Güçlendirmesi Süre Kontrolü
    if (YURUME_HIZI !== TEMEL_YURUME_HIZI && Date.now() > hizlanmaBittiZamani) {
        YURUME_HIZI = TEMEL_YURUME_HIZI;
        console.log("Hız güçlendirmesi sona erdi.");
    }


    // Maksimum Skoru Güncelleme
    skoruYerelKaydet(mevcutOda); 

    // Odadaki tüm düşmanlar yok edildi mi?
    if (dusmanlar.length === 0 && !oyunBittiMi && mevcutOda > 0) { 
        sonrakiOdayaGec();
    }
    
    // 5. Tehlikeli Mermi Çarpışma Kontrolü (Kamikaze Düşman Mermileri)
    for (let i = mermiler.length - 1; i >= 0; i--) {
        const mermi = mermiler[i];
        
        // Sadece tehlikeli (düşmandan fırlayan) mermileri kontrol et
        if (mermi.tehlikeli) { 
             if (
                glitch.x < mermi.x + mermi.genislik &&
                glitch.x + glitch.genislik > mermi.x &&
                glitch.y < mermi.y + mermi.yukseklik &&
                glitch.y + glitch.yukseklik > mermi.y
            ) {
                // Glitch hasar aldı
                glitch.can--; 
                console.log("Glitch Mermi Hasarı Aldı! Kalan Can: " + glitch.can);
                
                // Hasar aldığında ışınlanma ve oyun bitiş kontrolü
                glitch.x = BASLANGIC_X; 
                glitch.y = ZEMIN_Y;
                glitch.hiz_x = 0;
                glitch.hiz_y = 0;
                
                if (glitch.can <= 0) {
                    oyunBittiMi = true; 
                    glitch.can = 0; 
                    skoruYerelKaydet(mevcutOda); 
                }

                mermiler.splice(i, 1); // Mermiyi sil
                break; // Aynı karede birden fazla mermi çarpsa bile tek hasar alsın
            }
        }
    }
}

// =======================================================
// E. DÜŞMAN MANTIĞI VE ÇARPIŞMA
// =======================================================

function patlamadaMermiFirlat(x, y) {
    const MERMI_HIZI = 5; 
    const MERMI_GENISLIK = 8;
    const MERMI_YUKSEKLIK = 8;
    const YONLER = [
        { x: MERMI_HIZI, y: 0 },         // Sağa
        { x: -MERMI_HIZI, y: 0 },        // Sola
        { x: 0, y: MERMI_HIZI },         // Aşağı
        { x: 0, y: -MERMI_HIZI }         // Yukarı
    ];
    
    // Mermileri yarat
    YONLER.forEach(yon => {
        mermiler.push({
            x: x + MERMI_GENISLIK / 2,
            y: y + MERMI_YUKSEKLIK / 2,
            genislik: MERMI_GENISLIK,
            yukseklik: MERMI_YUKSEKLIK,
            hiz_x: yon.x,
            hiz_y: yon.y, 
            renk: '#ff0000', // Kırmızı renkli patlama mermileri
            tehlikeli: true // Bu merminin düşman tarafından atıldığını işaretliyoruz
        });
    });
}

function dusmanlariGuncelle() {
    for (let i = 0; i < dusmanlar.length; i++) {
        let bug = dusmanlar[i];
        
        if (bug.tip === 'yuruyen' || bug.tip === 'kamikaze') {
            // 1. Yerçekimini Uygulama (Yürüyen / Kamikaze Düşman)
            bug.y += YER_CEKIMI * 2; 
            
            let yerdeMi = false;
            
            // 2. Platform Çarpışma Kontrolü 
            platformlar.forEach(p => {
                if (
                    bug.x < p.x + p.genislik &&
                    bug.x + bug.genislik > p.x &&
                    bug.y + bug.yukseklik < p.y + 10 && 
                    bug.y + bug.yukseklik + YER_CEKIMI * 2 >= p.y 
                ) {
                    // Platformun üzerine sabitle
                    bug.y = p.y - bug.yukseklik;
                    yerdeMi = true;
                }
            });

            // 3. Yatay Hareket ve Kenar Kontrolü 
            if (yerdeMi) {
                bug.x += bug.hiz_x;
                
                // Platform Kenar Kontrolü
                let dusecekMi = true;
                platformlar.forEach(p => {
                    if (
                        bug.x + bug.genislik > p.x &&
                        bug.x < p.x + p.genislik &&
                        bug.y + bug.yukseklik === p.y 
                    ) {
                        let kenarMesafe = 5; 
                        let sonrakiKonumX = bug.x + bug.hiz_x;

                        if (bug.hiz_x > 0) { 
                            if (sonrakiKonumX + bug.genislik < p.x + p.genislik - kenarMesafe) {
                                dusecekMi = false;
                            }
                        } else if (bug.hiz_x < 0) { 
                            if (sonrakiKonumX > p.x + kenarMesafe) {
                                dusecekMi = false;
                            }
                        }
                    }
                });
                
                // Eğer düşecekse veya Canvas kenarına çarptıysa yön değiştir
                if (dusecekMi || bug.x + bug.genislik > canvas.width || bug.x < 0) {
                     bug.hiz_x *= -1; 
                }
            }
            
        } else if (bug.tip === 'ucan') { 
            // Uçan Düşman Hareketi (Yerçekimi Yok)
            bug.x += bug.hiz_x;
            bug.y += bug.hiz_y;
            
            // Menzil Kontrolü ve Yön Değiştirme
            if (bug.x < bug.merkez_x - bug.menzil || bug.x + bug.genislik > bug.merkez_x + bug.menzil) {
                bug.hiz_x *= -1;
            }
            if (bug.y < bug.merkez_y - bug.menzil || bug.y + bug.yukseklik > bug.merkez_y + bug.menzil) {
                bug.hiz_y *= -1;
            }

            // Canvas Sınırı Kontrolü
            if (bug.x < 0 || bug.x + bug.genislik > canvas.width) bug.hiz_x *= -1;
            if (bug.y < 0) bug.hiz_y *= -1;
            if (bug.y + bug.yukseklik > ZEMIN_Y) bug.hiz_y *= -1; 

        }
        
        // 4. Glitch ile Çarpışma Kontrolü (Her üç tip için de ortak)
        if (
            glitch.x < bug.x + bug.genislik &&
            glitch.x + glitch.genislik > bug.x &&
            glitch.y < bug.y + bug.yukseklik &&
            glitch.y + glitch.yukseklik > bug.y
        ) {
            carpismayiYonlendirme(glitch, bug, i);
        }
    }
}

function mermileriGuncelle() {
    for (let i = mermiler.length - 1; i >= 0; i--) {
        const mermi = mermiler[i];
        
        // 1. Mermiyi Hareket Ettir 
        mermi.x += mermi.hiz_x;
        mermi.y += mermi.hiz_y; // Patlama mermileri için dikey hareket

        // 2. Sınır Kontrolü
        if (mermi.x < -20 || mermi.x > canvas.width + 20 || mermi.y < -20 || mermi.y > ZEMIN_Y + 20) { 
            mermiler.splice(i, 1);
            continue;
        }

        // 3. Düşman Çarpışma Kontrolü (Sadece oyuncunun mermileri düşmanlara çarpar)
        if (!mermi.tehlikeli) {
            let sil = false;

            for (let j = dusmanlar.length - 1; j >= 0; j--) {
                const bug = dusmanlar[j];
                
                if (
                    mermi.x < bug.x + bug.genislik && mermi.x + mermi.genislik > bug.x &&
                    mermi.y < bug.y + bug.yukseklik && mermi.y + mermi.yukseklik > bug.y
                ) {
                    // Kamikaze Bug patlaması
                    if (bug.tip === 'kamikaze') {
                        patlamadaMermiFirlat(bug.x, bug.y);
                        console.log("Kamikaze Bug (Atış) patladı!");
                    }
                    
                    // Çarpışma oldu!
                    dusmanlar.splice(j, 1); // Düşmanı öldür
                    sil = true;
                    break; 
                }
            }
            
            // Mermi bir şeye çarptıysa sil
            if (sil) {
                mermiler.splice(i, 1);
            }
        }
    }
}


function carpismayiYonlendirme(glitch, bug, bugIndex) {
    const glitchAlt = glitch.y + glitch.yukseklik;
    const bugUst = bug.y;

    if (glitch.hiz_y > 0 && glitchAlt < bugUst + 10) { 
        // VURUŞ (Düşmana hasar verme)
        
        glitch.hiz_y = VURUS_GERI_TEPME_KUVVETI; 
        glitch.ziplamaHakki = 2;
        glitch.renk = '#00ffff'; 
        
        // Kamikaze Bug patlaması
        if (bug.tip === 'kamikaze') {
            patlamadaMermiFirlat(bug.x, bug.y);
            console.log("Kamikaze Bug (Zıplama) patladı!");
        }

        // Düşman öldü
        dusmanlar.splice(bugIndex, 1);
        
    } else {
        // HASAR ALMA (Glitch hasar aldı)
        
        glitch.can--; 
        console.log("Glitch Hasar Aldı! Kalan Can: " + glitch.can);

        // Başlangıç noktasına ışınlanma
        glitch.x = BASLANGIC_X; 
        glitch.y = ZEMIN_Y;
        glitch.hiz_x = 0;
        glitch.hiz_y = 0;
        glitch.renk = '#ff00ff'; 
        
        if (glitch.can <= 0) {
            oyunBittiMi = true; 
            glitch.can = 0; 
            console.log("OYUN BİTTİ!");
            skoruYerelKaydet(mevcutOda); // Öldüğünde de skoru kaydet
        }
    }
}

// =======================================================
// F. YENİDEN BASLATMA MANTIĞI
// =======================================================

function yenidenBaslat() {
    // Glitch'i sıfırla
    glitch.x = BASLANGIC_X;
    glitch.y = ZEMIN_Y;
    glitch.hiz_x = 0;
    glitch.hiz_y = 0;
    glitch.can = 3;
    glitch.ziplamaHakki = 2;
    glitch.renk = '#ff00ff';
    
    YURUME_HIZI = TEMEL_YURUME_HIZI; 
    hizlanmaBittiZamani = 0;
    sonAtisZamani = 0; 

    odaOlustur(1); 

    oyunBittiMi = false; 
    oyunDongusu(); 
}

// =======================================================
// G. ODA YÖNETİMİ
// =======================================================

function rastgeleSayi(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function odaOlustur(odaIndex) {
    platformlar = [];
    dusmanlar = [];
    powerUps = []; 
    mermiler = []; 
    mevcutOda = odaIndex;

    // Ana Zemin Platformu 
    platformlar.push({
        x: 0,
        y: ZEMIN_Y + glitch.yukseklik, 
        genislik: ODA_GENISLIGI,
        yukseklik: ODA_YUKSEKLIGI - ZEMIN_Y,
        renk: '#555555' 
    });
    
    // Glitch'i odanın başlangıç noktasına taşı
    glitch.x = BASLANGIC_X;
    glitch.y = ZEMIN_Y;

    // 1. Rastgele Platformlar Oluşturma 
    const platformSayisi = rastgeleSayi(3, 5); 
    
    for (let i = 0; i < platformSayisi; i++) {
        const pGenislik = rastgeleSayi(80, 200);
        const pYukseklik = 10; 
        const pX = rastgeleSayi(0, ODA_GENISLIGI - pGenislik);
        const pY = rastgeleSayi(150, ZEMIN_Y - 50); 

        platformlar.push({
            x: pX,
            y: pY,
            genislik: pGenislik,
            yukseklik: pYukseklik,
            renk: '#333333' 
        });
    }

    // 2. Rastgele Düşmanlar Oluşturma 
    const dusmanSayisi = rastgeleSayi(2 + Math.floor(odaIndex / 5), 4 + Math.floor(odaIndex / 5)); 
    const dusmanGenislik = 30;
    const dusmanYukseklik = 30;

    for (let i = 0; i < dusmanSayisi; i++) {
        // Her düşman için rastgele bir tip belirle:
        let tip = 'yuruyen'; 
        const rastgeleDeger = Math.random();

        if (rastgeleDeger < (0.1 + odaIndex * 0.02)) { 
            tip = 'kamikaze';
        } else if (rastgeleDeger < (0.2 + odaIndex * 0.05)) { 
            tip = 'ucan';
        }
        
        let hedefPlatform = null;
        let dusmanX = 0;
        let dusmanY = 0;
        let guvenliMi = false;
        let denemeSayaci = 0;
        
        // Yürüyen ve Kamikaze için güvenli platform bulma döngüsü
        if (tip === 'yuruyen' || tip === 'kamikaze') {
            const minIndex = (platformlar.length > 1) ? 1 : 0;
            
            while (!guvenliMi && denemeSayaci < 20) { 
                denemeSayaci++;
                guvenliMi = true; 
                
                const rastgelePlatformIndex = rastgeleSayi(minIndex, platformlar.length - 1);
                const adayPlatform = platformlar[rastgelePlatformIndex];
                
                if (adayPlatform.genislik < dusmanGenislik * 3) { 
                    guvenliMi = false;
                    continue;
                }
                
                hedefPlatform = adayPlatform;
                dusmanY = hedefPlatform.y - dusmanYukseklik; 
                dusmanX = rastgeleSayi(hedefPlatform.x, hedefPlatform.x + hedefPlatform.genislik - dusmanGenislik);
                
                if (hedefPlatform.x < 100 && dusmanX < 100) {
                    dusmanX += 100;
                }
                
                // Diğer platformlarla sıkışma kontrolü
                platformlar.forEach(p => {
                    if (p === hedefPlatform) return; 
                    const dikeyMesafe = Math.abs(p.y - (hedefPlatform.y - dusmanYukseklik));
                    
                    if (dikeyMesafe < dusmanYukseklik + 10) { 
                        const yatayCakisma = Math.max(0, Math.min(dusmanX + dusmanGenislik, p.x + p.genislik) - Math.max(dusmanX, p.x));
                        if (yatayCakisma > 0) {
                            guvenliMi = false;
                        }
                    }
                });
            }
        } else { // Uçan düşman
            dusmanX = rastgeleSayi(50, ODA_GENISLIGI - 80);
            dusmanY = rastgeleSayi(50, ZEMIN_Y - 100); 
            guvenliMi = true; 
            hedefPlatform = {x: dusmanX, y: dusmanY, genislik: 0, yukseklik: 0}; 
        }
        
        if (!guvenliMi) continue; 

        // Düşmanı listeye ekle
        if (tip === 'yuruyen') {
            dusmanlar.push({
                x: dusmanX,
                y: dusmanY,
                genislik: dusmanGenislik,
                yukseklik: dusmanYukseklik,
                renk: '#ff8c00', // Yürüyen Bug: Koyu Turuncu
                hiz_x: (Math.random() > 0.5 ? 1 : -1) * rastgeleSayi(2, 4),
                tip: 'yuruyen'
            });
        } else if (tip === 'kamikaze') {
            dusmanlar.push({
                x: dusmanX,
                y: dusmanY,
                genislik: dusmanGenislik,
                yukseklik: dusmanYukseklik,
                renk: '#ff0000', // Kamikaze Bug: Kırmızı
                hiz_x: (Math.random() > 0.5 ? 1 : -1) * rastgeleSayi(3, 5), // Daha hızlı
                tip: 'kamikaze'
            });
        }
        else { // 'ucan'
            const merkezMenzil = 50; 
            dusmanlar.push({
                x: dusmanX,
                y: dusmanY,
                genislik: dusmanGenislik,
                yukseklik: dusmanYukseklik,
                renk: '#8a2be2', 
                hiz_x: (Math.random() > 0.5 ? 1 : -1) * rastgeleSayi(1, 3),
                hiz_y: (Math.random() > 0.5 ? 1 : -1) * rastgeleSayi(1, 3),
                tip: 'ucan',
                merkez_x: dusmanX,
                merkez_y: dusmanY,
                menzil: merkezMenzil,
            });
        }
    }

    // 3. Güçlendirmeleri Oluşturma (Aynı kalır)
    const powerUpSayisi = rastgeleSayi(1, 2); 
    const powerUpTipleri = ['can', 'hiz'];

    for (let i = 0; i < powerUpSayisi; i++) {
        const minIndex = (platformlar.length > 1) ? 1 : 0;
        const rastgelePlatformIndex = rastgeleSayi(minIndex, platformlar.length - 1);
        const hedefPlatform = platformlar[rastgelePlatformIndex];
        const tip = powerUpTipleri[rastgeleSayi(0, powerUpTipleri.length - 1)];

        const puY = hedefPlatform.y - GUCLENDIRME_BOYUT;
        const puX = rastgeleSayi(hedefPlatform.x, hedefPlatform.x + hedefPlatform.genislik - GUCLENDIRME_BOYUT);

        powerUps.push({
            x: puX,
            y: puY,
            genislik: GUCLENDIRME_BOYUT,
            yukseklik: GUCLENDIRME_BOYUT,
            renk: tip === 'can' ? '#00ff00' : '#ffff00', 
            tip: tip
        });
    }
    
    console.log(`Yeni Oda Yüklendi: ${mevcutOda}. Düşman Sayısı: ${dusmanlar.length}. Güçlendirme Sayısı: ${powerUps.length}`);
}

function sonrakiOdayaGec() {
    odaOlustur(mevcutOda + 1);
}

// =======================================================
// H. ÇİZİM FONKSİYONU
// =======================================================

function canBariniCiz() {
    const BAR_X = 20; 
    const BAR_Y = 20; 
    const KALP_GENISLIK = 25; 
    const KALP_YUKSEKLIK = 25; 
    const ARALIK = 5; 
    const MAX_CAN = 5; 
    
    // Can Barı başlığını çiz
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Can:', BAR_X, BAR_Y + 18); 

    // Her bir can/kalp karesini çiz
    for (let i = 0; i < MAX_CAN; i++) {
        const x = BAR_X + 60 + i * (KALP_GENISLIK + ARALIK); 
        
        if (i < glitch.can) {
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(x, BAR_Y, KALP_GENISLIK, KALP_YUKSEKLIK);
            ctx.strokeStyle = '#009900'; 
        } else {
            ctx.fillStyle = '#333333';
            ctx.fillRect(x, BAR_Y, KALP_GENISLIK, KALP_YUKSEKLIK);
            ctx.strokeStyle = '#555555'; 
        }
        
        ctx.lineWidth = 2;
        ctx.strokeRect(x, BAR_Y, KALP_GENISLIK, KALP_YUKSEKLIK);
    }
}


function cizimYap() {
    // Ekranı temizle
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Platformları Çizme
    platformlar.forEach(p => {
        ctx.fillStyle = (p.y > ZEMIN_Y) ? '#555555' : p.renk || '#333333';
        ctx.fillRect(p.x, p.y, p.genislik, p.yukseklik);
    });
    
    // Düşmanları Çizme
    dusmanlar.forEach(bug => {
        ctx.fillStyle = bug.renk;
        ctx.fillRect(bug.x, bug.y, bug.genislik, bug.yukseklik);
    });

    // Güçlendirmeleri Çizme 
    powerUps.forEach(pu => {
        ctx.fillStyle = pu.renk;
        ctx.fillRect(pu.x, pu.y, pu.genislik, pu.yukseklik);
    });
    
    // Mermileri Çizme
    mermiler.forEach(mermi => {
        ctx.fillStyle = mermi.renk;
        ctx.fillRect(mermi.x, mermi.y, mermi.genislik, mermi.yukseklik);
    });

    // Glitch'i Çiz
    ctx.fillStyle = glitch.renk;
    ctx.fillRect(glitch.x, glitch.y, glitch.genislik, glitch.yukseklik);

    // Can Barını Çizme
    canBariniCiz(); 

    // Skoru Görüntüleme (HUD)
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left'; 
    
    const hizDurumu = (YURUME_HIZI !== TEMEL_YURUME_HIZI) ? ' (HIZLI)' : '';
    
    const beklemeSuresi = sonAtisZamani + ATIS_COOLDOWN - Date.now();
    let atisDurumu = '';
    
    if (beklemeSuresi <= 0) {
        atisDurumu = '| Atış (F): HAZIR';
    } else {
        atisDurumu = `| Atış (F): Yükleniyor (${(beklemeSuresi / 1000).toFixed(1)}s)`;
    }
    
    ctx.fillText(`Oda: ${mevcutOda} | MAKSİMUM: ${maksimumOda}${hizDurumu} ${atisDurumu}`, 20, 55); 
    
    // OYUN BİTTİ yazısını çizme
    if (oyunBittiMi) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ff00ff';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(YENIDEN_BASLATMA_YAZISI, canvas.width / 2, canvas.height / 2);
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#ffffff'; 
        ctx.fillText("İpucu: Düşmanları 'üstünden zıplayarak' ya da 'F' tuşuyla öldürebilirsin!", canvas.width / 2, canvas.height / 2 + 50);
        
        // Glitch Leap: Mobil Yeniden Başlatma Düğmesini Göster
        if (yenidenBaslatTus) {
            yenidenBaslatTus.style.display = 'block'; 
        }

    } else {
        // Glitch Leap: Oyun aktifken Mobil Yeniden Başlatma Düğmesini Gizle
        if (yenidenBaslatTus) {
            yenidenBaslatTus.style.display = 'none'; 
        }
        
        requestAnimationFrame(oyunDongusu); 
    }
}

// =======================================================
// I. ANA OYUN DÖNGÜSÜ
// =======================================================

function oyunDongusu() {
    if (oyunBittiMi) {
        cizimYap(); 
        return; 
    }

    guncelle(); 
    dusmanlariGuncelle();
    mermileriGuncelle(); 
    cizimYap();
}

// =======================================================
// J. MOBİL KONTROL MANTIĞI
// =======================================================
const solTus = document.getElementById('solTus');
const sagTus = document.getElementById('sagTus');
const zıplaTus = document.getElementById('zıplaTus');
const atisTus = document.getElementById('atisTus');
const yenidenBaslatTus = document.getElementById('yenidenBaslatTus'); // YENİ TANIM

function mobilTusOlayiEkle(element, kod, tip) {
    if (!element) return; 

    // Basma Olayı (mousedown/touchstart)
    const basmaHandler = (e) => {
        if (e.type.includes('touch')) e.preventDefault();
        tuslar[kod] = true; 
        
        if (tip === 'atis') {
            if (Date.now() > sonAtisZamani + ATIS_COOLDOWN) {
                mermiFirlat();
                sonAtisZamani = Date.now();
            }
        } else if (tip === 'zipla') {
            if (glitch.ziplamaHakki > 0 && !oyunBittiMi) {
                glitch.hiz_y = ZIPLAMA_KUVVETI; 
                glitch.yerdeMi = false;
                glitch.ziplamaHakki--; 

                if (glitch.ziplamaHakki === 1) {
                     glitch.renk = '#00ffff'; 
                }
            }
        }
    };
    
    // Bırakma Olayı (mouseup/touchend)
    const birakmaHandler = (e) => {
        if (e.type.includes('touch')) e.preventDefault();
        tuslar[kod] = false; 
    };

    // Dinleyicileri ekle
    element.addEventListener('mousedown', basmaHandler);
    element.addEventListener('touchstart', basmaHandler);
    
    element.addEventListener('mouseup', birakmaHandler);
    element.addEventListener('touchend', birakmaHandler);
    element.addEventListener('touchcancel', birakmaHandler); 
    element.addEventListener('mouseleave', (e) => { // Mouse buton dışına çıkarsa bırak
        if (e.buttons === 0) tuslar[kod] = false; 
    });
}

// YENİDEN BAŞLATMA DÜĞMESİ MANTIĞI
if (yenidenBaslatTus) {
    yenidenBaslatTus.addEventListener('click', () => {
        if (oyunBittiMi) {
            yenidenBaslat();
        }
    });
    // Mobil dokunmatik desteği için
    yenidenBaslatTus.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (oyunBittiMi) {
            yenidenBaslat();
        }
    });
}

// Olayları Klavye Kodlarına Eşleştirme
mobilTusOlayiEkle(solTus, 'KeyA', 'hareket'); 
mobilTusOlayiEkle(sagTus, 'KeyD', 'hareket'); 
mobilTusOlayiEkle(zıplaTus, 'Space', 'zipla'); 
mobilTusOlayiEkle(atisTus, 'KeyF', 'atis');


// Oyun döngüsünü başlat
skoruYereldenYukle(); // Başlangıçta kaydı yükle
odaOlustur(1); 
oyunDongusu();
