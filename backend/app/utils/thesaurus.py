"""
CPWD Delhi Schedule of Rates (DSR 2023) & GeM Product Taxonomy Thesaurus
Maps technical government procurement item codes and colloquial descriptions
directly to canonical Bureau of Indian Standards (BIS) specifications.
"""
import re
from typing import Dict, List, Tuple, Optional, Any

# CPWD Delhi Schedule of Rates (DSR 2023) Master Mapping
CPWD_DSR_MAPPING: Dict[str, Dict[str, Any]] = {
    "18.1": {
        "title": "Providing and fixing G.I. pipes complete with G.I. fittings and clamps",
        "standards": ["IS 1239 (Part 1)", "IS 1879", "IS 1239 (Part 2)"],
        "category": "WATER_SUPPLY",
        "keywords": ["gi pipe", "galvanized iron", "water pipe", "mild steel tube", "plumbing"]
    },
    "18.1.1": {
        "title": "15 mm dia nominal bore G.I. pipes",
        "standards": ["IS 1239 (Part 1)", "IS 1879"],
        "category": "WATER_SUPPLY",
        "keywords": ["15mm gi pipe", "mild steel tube 15mm", "plumbing"]
    },
    "18.1.2": {
        "title": "20 mm dia nominal bore G.I. pipes",
        "standards": ["IS 1239 (Part 1)", "IS 1879"],
        "category": "WATER_SUPPLY",
        "keywords": ["20mm gi pipe", "mild steel tube 20mm"]
    },
    "18.1.3": {
        "title": "25 mm dia nominal bore G.I. pipes",
        "standards": ["IS 1239 (Part 1)", "IS 1879"],
        "category": "WATER_SUPPLY",
        "keywords": ["25mm gi pipe", "mild steel tube 25mm"]
    },
    "18.1.4": {
        "title": "32 mm dia nominal bore G.I. pipes",
        "standards": ["IS 1239 (Part 1)", "IS 1879"],
        "category": "WATER_SUPPLY",
        "keywords": ["32mm gi pipe", "mild steel tube 32mm"]
    },
    "18.1.5": {
        "title": "40 mm dia nominal bore G.I. pipes",
        "standards": ["IS 1239 (Part 1)", "IS 1879"],
        "category": "WATER_SUPPLY",
        "keywords": ["40mm gi pipe", "mild steel tube 40mm"]
    },
    "18.1.6": {
        "title": "50 mm dia nominal bore G.I. pipes",
        "standards": ["IS 1239 (Part 1)", "IS 1879"],
        "category": "WATER_SUPPLY",
        "keywords": ["50mm gi pipe", "mild steel tube 50mm"]
    },
    "18.2": {
        "title": "Providing and fixing Chlorinated Polyvinyl Chloride (CPVC) pipes",
        "standards": ["IS 15778"],
        "category": "WATER_SUPPLY",
        "keywords": ["cpvc pipes", "chlorinated pvc", "hot cold water"]
    },
    "18.7": {
        "title": "Providing and fixing High Density Polyethylene (HDPE) pipes",
        "standards": ["IS 4984", "IS 14333"],
        "category": "WATER_SUPPLY",
        "keywords": ["hdpe pipe", "potable water supply", "polyethylene"]
    },
    "18.8": {
        "title": "Providing and fixing gun metal gate valve with C.I. wheel",
        "standards": ["IS 778"],
        "category": "WATER_SUPPLY",
        "keywords": ["gun metal gate valve", "brass valve", "sluice valve"]
    },
    "5.22": {
        "title": "Steel reinforcement for R.C.C work Thermo-Mechanically Treated bars (TMT bars Fe 500D)",
        "standards": ["IS 1786"],
        "category": "CONSTRUCTION",
        "keywords": ["tmt rebar", "fe 500d", "reinforcement steel", "sariya"]
    },
    "5.22.1": {
        "title": "Fe 415 TMT bars for concrete reinforcement",
        "standards": ["IS 1786"],
        "category": "CONSTRUCTION",
        "keywords": ["fe 415", "tmt sariya"]
    },
    "5.22.2": {
        "title": "Fe 500 TMT bars for concrete reinforcement",
        "standards": ["IS 1786"],
        "category": "CONSTRUCTION",
        "keywords": ["fe 500", "tmt bar"]
    },
    "5.22.3": {
        "title": "Fe 500D TMT bars for earthquake resistant concrete reinforcement",
        "standards": ["IS 1786"],
        "category": "CONSTRUCTION",
        "keywords": ["fe 500d", "earthquake resistant", "ductile rebar"]
    },
    "4.1": {
        "title": "Providing and laying in position specified grade of reinforced cement concrete",
        "standards": ["IS 456", "IS 8112", "IS 1489 (Part 1)"],
        "category": "CONSTRUCTION",
        "keywords": ["rcc concrete", "portland cement", "structural concrete"]
    },
    "10.25": {
        "title": "Steel work in built up tubular (round, square or rectangular) trusses",
        "standards": ["IS 1161", "IS 4923"],
        "category": "CONSTRUCTION",
        "keywords": ["tubular truss", "structural tube", "hollow section"]
    },
    "11.1": {
        "title": "Wiring in conduit with PVC insulated copper conductor cables 1100V",
        "standards": ["IS 694"],
        "category": "ELECTRICAL",
        "keywords": ["pvc wire", "1100v cable", "copper conductor", "building wire"]
    },
    "11.4": {
        "title": "Supply and fixing of LED street lighting luminaires and floodlights",
        "standards": ["IS 10322 (Part 5/Sec 3)", "IS 16102 (Part 1)"],
        "category": "ELECTRICAL",
        "keywords": ["led street light", "luminaire", "floodlight", "outdoor lighting"]
    },
    "13.1": {
        "title": "Providing and applying plastic emulsion paint exterior weather resistant",
        "standards": ["IS 15489"],
        "category": "CHEMICALS",
        "keywords": ["emulsion paint", "exterior paint", "weatherproof"]
    },
    "3.1": {
        "title": "Providing and laying reinforced concrete pipes for highway culverts and drainage",
        "standards": ["IS 458"],
        "category": "CONSTRUCTION",
        "keywords": ["hume pipe", "np2 np3 concrete pipe", "culvert pipe"]
    },
}

# GeM (Government e-Marketplace) Product Taxonomy
GEM_TAXONOMY_MAPPING: Dict[str, Dict[str, Any]] = {
    "mild steel tubes": {
        "standards": ["IS 1239 (Part 1)"],
        "description": "GeM Category: Mild Steel Tubes and Pipes",
    },
    "tmt bars": {
        "standards": ["IS 1786"],
        "description": "GeM Category: High Strength Deformed Steel Bars for Concrete Reinforcement",
    },
    "hdpe pipes": {
        "standards": ["IS 4984", "IS 14333"],
        "description": "GeM Category: High Density Polyethylene Pipes for Potable Water & Sewerage",
    },
    "distribution transformers": {
        "standards": ["IS 1180 (Part 1)"],
        "description": "GeM Category: Outdoor Type Oil Immersed Distribution Transformers Up to 2500 kVA",
    },
    "led luminaires": {
        "standards": ["IS 10322 (Part 5/Sec 3)", "IS 16102 (Part 1)"],
        "description": "GeM Category: LED Luminaires & Self-Ballasted Lamps",
    },
    "fire extinguishers": {
        "standards": ["IS 15683"],
        "description": "GeM Category: Portable Fire Extinguishers (ABC Dry Powder, Foam)",
    },
    "industrial safety helmets": {
        "standards": ["IS 2925"],
        "description": "GeM Category: Industrial Safety Helmets",
    },
    "safety footwear": {
        "standards": ["IS 15298 (Part 2)"],
        "description": "GeM Category: Personal Protective Equipment - Safety Footwear",
    },
    "solar pv modules": {
        "standards": ["IS 14286"],
        "description": "GeM Category: Crystalline Silicon Terrestrial Photovoltaic (PV) Modules",
    },
}


def resolve_thesaurus(query: str) -> Tuple[str, List[str], Optional[Dict[str, Any]]]:
    """
    Check if query contains CPWD DSR Item codes or GeM Category phrases.
    Returns:
        (expanded_query, targeted_standards, matched_thesaurus_entry)
    """
    clean_q = query.strip()
    clean_q_lower = clean_q.lower()

    # 1. Check CPWD DSR Code match (e.g. "18.1.1", "item 18.1", "CPWD 5.22.3", "dsr 10.25")
    cpwd_pattern = r'\b(?:item|cpwd|dsr)?\s*([0-9]{1,2}\.[0-9]{1,2}(?:\.[0-9]{1,2})?)\b'
    match = re.search(cpwd_pattern, clean_q_lower)
    if match:
        item_code = match.group(1)
        if item_code in CPWD_DSR_MAPPING:
            entry = CPWD_DSR_MAPPING[item_code]
            expanded = f"{clean_q} {entry['title']} {' '.join(entry['keywords'])}"
            return expanded, entry["standards"], {
                "source": "CPWD_DSR_2023",
                "item_code": item_code,
                "title": entry["title"],
                "standards": entry["standards"],
            }

    # 2. Check GeM Taxonomy keywords
    for gem_key, entry in GEM_TAXONOMY_MAPPING.items():
        if gem_key in clean_q_lower:
            expanded = f"{clean_q} {entry['description']}"
            return expanded, entry["standards"], {
                "source": "GEM_TAXONOMY",
                "category": gem_key,
                "title": entry["description"],
                "standards": entry["standards"],
            }

    # 3. No thesaurus trigger
    return clean_q, [], None
