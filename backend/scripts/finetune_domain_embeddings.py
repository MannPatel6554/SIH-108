"""
Domain-Specific Fine-Tuning Pipeline for Indian Standards Procurement
SIH 2026 — Problem Statement PS108 (Ministry of Consumer Affairs / BIS)

Uses PyTorch native MultipleNegativesRankingLoss for fast, zero-dependency
domain adaptation of SentenceTransformer embeddings.
"""
import os
import sys
import time
import torch
import torch.nn as nn
from torch.optim import AdamW
from sentence_transformers import SentenceTransformer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PROCUREMENT_TRAINING_PAIRS = [
    # Construction & Steel
    ("high strength deformed steel bars for concrete reinforcement", "IS 1786: High strength deformed steel bars and wires for concrete reinforcement (TMT Bars Fe 415, Fe 500D, Fe 550D)"),
    ("thermo mechanically treated rebar for earthquake resistant building", "IS 1786: High strength deformed steel bars and wires for concrete reinforcement (TMT Bars Fe 415, Fe 500D, Fe 550D)"),
    ("mild steel tubes and tubulars for water gas and sewage", "IS 1239 (Part 1): Steel Tubes, Tubulars and Other Wrought Steel Fittings - Part 1: Steel Tubes"),
    ("galvanized iron gi pipes for plumbing and potable water distribution", "IS 1239 (Part 1): Steel Tubes, Tubulars and Other Wrought Steel Fittings - Part 1: Steel Tubes"),
    ("large diameter welded steel pipe for cross country water supply", "IS 3589: Steel pipes for water and sewage (168.3 to 2540 mm outside diameter)"),
    ("ordinary portland cement 43 grade for general concrete construction", "IS 8112: Ordinary Portland Cement, 43 Grade - Specification"),
    ("portland pozzolana cement fly ash based for plastering and masonry", "IS 1489 (Part 1): Portland Pozzolana Cement - Specification - Part 1: Fly Ash Based"),
    ("structural steel standard quality plates and sections", "IS 2062: Hot Rolled Medium and High Tensile Structural Steel"),
    
    # Water & Sanitation
    ("high density polyethylene hdpe pipes for drinking water supply", "IS 4984: High Density Polyethylene (HDPE) Pipes for Potable Water Supplies"),
    ("polyethylene pipes for sewerage and industrial effluent drainage", "IS 14333: High Density Polyethylene (HDPE) Pipes for Sewerage"),
    ("polyethylene pipes for municipal fuel gas distribution networks", "IS 14885: Polyethylene Pipes for the Supply of Gaseous Fuels"),
    ("precast concrete pipes for culverts and highway stormwater drainage", "IS 458: Precast Concrete Pipes (With and Without Reinforcement)"),
    ("rotational moulded polyethylene water storage tanks for overhead", "IS 12701: Rotational Moulded Polyethylene Water Storage Tanks"),

    # Electrical & Electronics (CRS Scheme)
    ("fixed general purpose led luminaires and street lighting", "IS 10322 (Part 5/Sec 3): Luminaires - Part 5: Particular Requirements - Section 3: Floodlights"),
    ("pvc insulated cables for working voltages up to and including 1100 v", "IS 694: Polyvinyl Chloride Insulated Unsheathed and Sheathed Cables/Cords with Rigid and Flexible Conductor for Working Voltages up to and Including 450/750 V"),
    ("self ballasted led lamps for general lighting services safety", "IS 16102 (Part 1): Self-Ballasted LED Lamps for General Lighting Services - Part 1: Safety Requirements"),
    ("lithium ion secondary cells and batteries for portable applications", "IS 16046 (Part 2): Secondary Cells and Batteries Containing Alkaline or Other Non-Acid Electrolytes - Safety Requirements for Portable Sealed Secondary Cells"),

    # Safety & PPE
    ("industrial safety helmets for construction workers", "IS 2925: Specification for Industrial Safety Helmets"),
    ("safety footwear with steel toe cap for industrial hazard protection", "IS 15298 (Part 2): Personal Protective Equipment - Part 2: Safety Footwear"),

    # Fire Safety & Disaster Management
    ("portable fire extinguishers dry powder and mechanical foam type", "IS 15683: Portable Fire Extinguishers - Performance and Construction"),
    ("landing valves and internal fire hydrants for buildings", "IS 5290: Specification for Landing Valves (Internal Hydrants)"),

    # Power & Renewable Energy
    ("outdoor distribution transformers up to and including 2500 kva 33 kv", "IS 1180 (Part 1): Outdoor Type Oil Immersed Distribution Transformers Up to and Including 2500 kVA, 33 kV"),
    ("crystalline silicon terrestrial photovoltaic solar pv modules", "IS 14286: Crystalline Silicon Terrestrial Photovoltaic (PV) Modules - Design Qualification and Type Approval"),

    # Medical & Healthcare Public Procurement
    ("medical examination and surgical gloves single use", "IS 13422: Sterile surgical gloves - Specification"),
    ("clinical thermometers electrical and digital for patient temperature", "IS 15814: Clinical Thermometers - Part 1: Metallic Liquid-in-Glass Devices with Maximum Device"),

    # Paints & Chemicals
    ("ready mixed paint exterior weather resistant emulsion", "IS 15489: Plastic Emulsion Paint - Specification"),

    # Multilingual Hindi Procurement Queries
    ("पानी की सप्लाई के लिए गैल्वनाइज्ड जीआई पाइप", "IS 1239 (Part 1): Steel Tubes, Tubulars and Other Wrought Steel Fittings - Part 1: Steel Tubes"),
    ("भूकंप रोधी निर्माण के लिए टीएमटी सरिया Fe 500D", "IS 1786: High strength deformed steel bars and wires for concrete reinforcement (TMT Bars Fe 415, Fe 500D, Fe 550D)"),
    ("पीने के पानी के लिए एचडीपीई पाइप", "IS 4984: High Density Polyethylene (HDPE) Pipes for Potable Water Supplies"),
    ("छत के लिए पानी की टंकी 1000 लीटर", "IS 12701: Rotational Moulded Polyethylene Water Storage Tanks"),
    ("सड़क और हाईवे के लिए कंक्रीट पाइप", "IS 458: Precast Concrete Pipes (With and Without Reinforcement)"),
    ("आग बुझाने का यंत्र और अग्निशामक", "IS 15683: Portable Fire Extinguishers - Performance and Construction"),
    ("बिजली के तार और केबल कॉपर एल्युमिनियम", "IS 694: Polyvinyl Chloride Insulated Unsheathed and Sheathed Cables/Cords with Rigid and Flexible Conductor for Working Voltages up to and Including 450/750 V"),
    ("सोलर पैनल और फोटोवोल्टिक मॉड्यूल", "IS 14286: Crystalline Silicon Terrestrial Photovoltaic (PV) Modules - Design Qualification and Type Approval"),
]


def run_fine_tuning(output_dir: str = "./models/bis_finetuned_embeddings", epochs: int = 3, lr: float = 2e-5):
    """Fine-tune embedding model using native PyTorch contrastive loop."""
    print("=" * 65)
    print("BIS SmartSpec AI — Domain Embedding Fine-Tuning Pipeline")
    print("=" * 65)
    print(f"Dataset Size: {len(PROCUREMENT_TRAINING_PAIRS)} curated procurement-standard pairs")
    print(f"Target Output: {output_dir}")

    base_model_name = "sentence-transformers/all-MiniLM-L6-v2"
    print(f"Loading base model (offline cached): {base_model_name}...")
    try:
        model = SentenceTransformer(base_model_name, local_files_only=True)
    except Exception:
        try:
            model = SentenceTransformer("./models/bis_finetuned_embeddings")
        except Exception:
            model = SentenceTransformer(base_model_name)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    model.train()

    queries = [pair[0] for pair in PROCUREMENT_TRAINING_PAIRS]
    standards = [pair[1] for pair in PROCUREMENT_TRAINING_PAIRS]

    optimizer = AdamW(model.parameters(), lr=lr)
    loss_fn = nn.CrossEntropyLoss()
    scale = 20.0  # Temperature scale for contrastive cosine loss

    print(f"Starting native PyTorch training loop on {device} ({epochs} epochs)...")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        optimizer.zero_grad()

        # Tokenize and encode query and standards
        q_features = model.tokenize(queries)
        q_features = {k: v.to(device) for k, v in q_features.items()}
        q_embeddings = model(q_features)["sentence_embedding"]
        q_embeddings = nn.functional.normalize(q_embeddings, p=2, dim=1)

        s_features = model.tokenize(standards)
        s_features = {k: v.to(device) for k, v in s_features.items()}
        s_embeddings = model(s_features)["sentence_embedding"]
        s_embeddings = nn.functional.normalize(s_embeddings, p=2, dim=1)

        # In-batch contrastive cosine similarity matrix
        similarity_matrix = torch.matmul(q_embeddings, s_embeddings.T) * scale
        labels = torch.arange(len(queries), device=device)

        loss = loss_fn(similarity_matrix, labels)
        loss.backward()
        optimizer.step()

        print(f"Epoch {epoch}/{epochs} - Contrastive Loss: {loss.item():.4f}")

    elapsed = time.time() - start_time
    print(f"Fine-tuning completed in {elapsed:.1f}s.")

    # Save fine-tuned checkpoint
    os.makedirs(output_dir, exist_ok=True)
    model.save(output_dir)
    print(f"[OK] Domain-adapted model saved to: {output_dir}")
    print("[OK] Fine-tuned embeddings ready for production procurement queries!")
    return True


if __name__ == "__main__":
    run_fine_tuning()
