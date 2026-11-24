# VoltSense AI — Hardware Sensor Calibration & Circuit Schematics

## 1. High-Voltage Measurement via Precision Attenuator
To measure the battery pack voltage safely without exceeding the microcontroller ADC limit (0 - 3.3V):

```
       (+) Pack Terminal [0 - 45V DC]
             |
            [R1] = 100 kΩ (0.1% Metal Film Precision)
             |
             +-----> ADC Input (ESP32 Pin 34)
             |
            [R2] = 10 kΩ (0.1% Metal Film Precision)
             |
            [C1] = 100 nF Ceramic Filter
             |
       (-) Pack Ground (Isolated)
```

**Attenuation Ratio:**
$$\text{Divider Ratio} = \frac{R_1 + R_2}{R_2} = \frac{100\text{k}\Omega + 10\text{k}\Omega}{10\text{k}\Omega} = 11.0$$

At maximum pack voltage $45.0\text{V}$, the pin voltage is:
$$V_{\text{pin}} = \frac{45.0\text{V}}{11.0} = 4.09\text{V}$$
*(For 400V packs, utilize isolated Sigma-Delta modulators like Texas Instruments AMC1301 or AMC1311 with 1200V galvanic isolation).*

---

## 2. Current Sensing via Bi-directional Hall Effect (ACS758 / ACS770)
- **Zero Current Output:** $V_{\text{out}} = \frac{V_{CC}}{2} = 1.65\text{V}$ (centered for bidirectional charge & discharge).
- **Sensitivity:** $40\text{ mV/A}$.
- **Formula:**
$$I_{\text{pack}} = \frac{V_{\text{pin}} - 1.65\text{V}}{0.040\text{ V/A}}$$

---

## 3. Module Temperature via NTC Thermistor (10k Beta 3950)
Temperature is solved via the Steinhart-Hart equation:
$$\frac{1}{T} = \frac{1}{T_0} + \frac{1}{\beta} \ln\left(\frac{R}{R_0}\right)$$
Where:
- $T_0 = 298.15\text{ K}$ ($25^\circ\text{C}$)
- $R_0 = 10{,}000\,\Omega$
- $\beta = 3950\text{ K}$

---

## 4. Galvanic Isolation & Automotive Safety Disclaimer
> [!CAUTION]
> **HIGH VOLTAGE WARNING:** Direct connection of an unisolated microcontroller to high-voltage EV battery traction packs (over 60V DC) presents fatal electric shock and fire hazards. Production integrations must communicate strictly via isolated digital CAN-bus (ISO11898-2) interfaces or isolated Modbus RS-485 with automotive safety compliance.
