"""
Seed technical clauses and engineering tolerances for Indian Standards (Deep Spec Search)
SIH 2026 — Problem Statement PS108
"""
import asyncio
import os
import sys
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.database import Base, Standard, StandardClause

DATABASE_URL = "sqlite+aiosqlite:///./data/bis_smartspec.db"

CLAUSE_DEFINITIONS = {
    "IS 1239 (Part 1)": [
        {
            "clause_number": "Clause 4.1",
            "clause_title": "Chemical Composition of Steel",
            "clause_text": "The steel shall conform to the following ladle analysis: Carbon max 0.20%, Manganese max 1.30%, Sulfur max 0.045%, Phosphorus max 0.045%.",
            "key_tolerances": "C <= 0.20%, S <= 0.045%, P <= 0.045%"
        },
        {
            "clause_number": "Clause 7.1",
            "clause_title": "Tensile Strength and Elongation",
            "clause_text": "Tubes shall have a minimum tensile strength of 320 MPa (N/mm²) and minimum elongation of 20% on gauge length 5.65√So.",
            "key_tolerances": "Tensile strength >= 320 MPa, Elongation >= 20%"
        },
        {
            "clause_number": "Clause 8.1",
            "clause_title": "Hydrostatic Pressure Test",
            "clause_text": "Each tube shall be tested hydrostatically at the manufacturer's works and shall withstand internal test pressure of 5.0 MPa without leakage or swelling.",
            "key_tolerances": "Test pressure 5.0 MPa (50 bar), Hold time >= 5 seconds"
        },
        {
            "clause_number": "Clause 9.1",
            "clause_title": "Galvanizing and Zinc Coating Mass",
            "clause_text": "Tubes specified as galvanized shall be hot-dip galvanized. The minimum total mass of zinc coating on internal and external surfaces combined shall be 360 g/m².",
            "key_tolerances": "Zinc coating mass >= 360 g/m², Purity >= 98.5% Zn"
        },
        {
            "clause_number": "Clause 10.2",
            "clause_title": "Wall Thickness and Mass Tolerances",
            "clause_text": "The thickness of tubes shall not fall below nominal thickness by more than 8% for Medium and Heavy classes, and 10% for Light class.",
            "key_tolerances": "Tolerance: -8% (Medium/Heavy), -10% (Light)"
        },
    ],
    "IS 1786": [
        {
            "clause_number": "Clause 4.2",
            "clause_title": "Strength Grade Designations",
            "clause_text": "Bars and wires shall be supplied in nominal grades Fe 415, Fe 500, Fe 500D, Fe 550, Fe 550D, and Fe 600, where 'D' denotes high ductility for earthquake resistance.",
            "key_tolerances": "Fe 415, Fe 500, Fe 500D, Fe 550D, Fe 600"
        },
        {
            "clause_number": "Clause 8.1",
            "clause_title": "Mechanical Properties (Fe 500D)",
            "clause_text": "For Fe 500D rebar: 0.2% proof stress / yield stress minimum 500.0 N/mm², tensile strength minimum 565.0 N/mm², and TS/YS ratio not less than 1.10.",
            "key_tolerances": "Yield stress >= 500 N/mm², TS >= 565 N/mm², TS/YS ratio >= 1.10"
        },
        {
            "clause_number": "Clause 8.3",
            "clause_title": "Total Elongation at Maximum Force (Agt)",
            "clause_text": "Fe 500D and Fe 550D grades shall have a minimum total elongation at maximum force (Agt) of 5.0% to ensure energy dissipation in seismic zones.",
            "key_tolerances": "Agt >= 5.0%, Uniform elongation >= 16%"
        },
        {
            "clause_number": "Clause 9.1",
            "clause_title": "Bend and Rebend Test",
            "clause_text": "Test pieces shall withstand bending through 180° around specified mandrel diameter without transverse ruptures or visible surface cracks.",
            "key_tolerances": "Mandrel diameter: 4d (<=20mm), 5d (>20mm), 180 deg bend"
        },
    ],
    "IS 4984": [
        {
            "clause_number": "Clause 5.1",
            "clause_title": "Raw Material Grade for Potable Water Supplies",
            "clause_text": "Pipes shall be manufactured from natural black polyethylene compound PE 63, PE 80, or PE 100 with finely dispersed carbon black content of 2.5 ± 0.5% by mass.",
            "key_tolerances": "PE 100, Carbon black 2.5% ± 0.5%, Density 940-958 kg/m³"
        },
        {
            "clause_number": "Clause 8.1",
            "clause_title": "Hydrostatic Strength at Elevated Temperature",
            "clause_text": "Pipes shall withstand internal hydrostatic pressure test at 20°C for 100 hours with induced hoop stress of 12.4 MPa, and at 80°C for 165 hours with hoop stress 5.4 MPa without bursting.",
            "key_tolerances": "100h at 20°C (12.4 MPa), 165h at 80°C (5.4 MPa)"
        },
        {
            "clause_number": "Clause 9.3",
            "clause_title": "Oxidation Induction Time (OIT)",
            "clause_text": "The oxidation induction time (thermal stability) of the material when tested at 200°C in oxygen atmosphere shall be not less than 20 minutes.",
            "key_tolerances": "OIT >= 20 minutes at 200°C"
        },
    ],
    "IS 694": [
        {
            "clause_number": "Clause 4.1",
            "clause_title": "Conductor Composition and Class",
            "clause_text": "Conductors shall be composed of plain annealed high-conductivity electrolytic copper or EC-grade aluminum conforming to IS 8130.",
            "key_tolerances": "Conductivity >= 99.9% IACS Copper, Class 1/2/5"
        },
        {
            "clause_number": "Clause 6.1",
            "clause_title": "Insulation Material and Working Voltage",
            "clause_text": "Insulation shall be PVC compound Type A or Type C suitable for working voltage up to and including 1100 V AC (phase-to-phase) or 1500 V DC.",
            "key_tolerances": "Rated voltage <= 1100 V, Max continuous conductor temp 70°C"
        },
        {
            "clause_number": "Clause 14.1",
            "clause_title": "High Voltage Spark Testing",
            "clause_text": "Every meter of core shall withstand online high-voltage spark testing at 3.0 kV AC RMS or 6.0 kV DC without breakdown during extrusion.",
            "key_tolerances": "Spark test voltage 3.0 kV AC, Zero flashover punctures"
        },
    ],
    "IS 10322 (Part 5/Sec 3)": [
        {
            "clause_number": "Clause 5.1",
            "clause_title": "Ingress Protection (IP) for Floodlights",
            "clause_text": "Outdoor floodlighting luminaires shall have a minimum ingress protection degree of IP 65 (dust-tight and protected against water jets from any direction).",
            "key_tolerances": "Minimum IP 65 (IEC 60529)"
        },
        {
            "clause_number": "Clause 12.1",
            "clause_title": "Thermal Endurance and Ambient Temperature",
            "clause_text": "The luminaire shall function continuously at ambient design temperature up to 50°C without exceeding thermal limits on driver and LED junction.",
            "key_tolerances": "Ambient temp <= 50°C, Driver case temp <= 75°C"
        },
    ],
    "IS 456": [
        {
            "clause_number": "Clause 5.1",
            "clause_title": "Permitted Cement Categories for Structural Concrete",
            "clause_text": "Concrete shall use 33/43/53 grade OPC conforming to IS 269/8112/12269, or Portland Pozzolana Cement conforming to IS 1489.",
            "key_tolerances": "IS 8112 (43 Grade OPC), IS 1489 (PPC)"
        },
        {
            "clause_number": "Clause 6.1",
            "clause_title": "Minimum Concrete Grade for RCC",
            "clause_text": "Minimum grade of reinforced concrete for structural work shall be M20. For severe marine environmental exposure, minimum grade M30 is mandatory.",
            "key_tolerances": "Min M20 (mild exposure), Min M30 (severe marine)"
        },
    ],
}


async def seed_clauses():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Load all standards
        res = await session.execute(select(Standard))
        standards = res.scalars().all()
        std_by_num = {s.standard_number: s for s in standards}

        inserted_count = 0
        for std_num, clauses in CLAUSE_DEFINITIONS.items():
            # Find all matching standard variants (e.g. IS 1239 and IS 1239 Part 1)
            matching_stds = [
                obj for num, obj in std_by_num.items()
                if std_num.lower() in num.lower() or num.lower() in std_num.lower()
            ]

            for std in matching_stds:
                for c_data in clauses:
                    # Check if clause already exists
                    check_res = await session.execute(
                        select(StandardClause).where(
                            StandardClause.standard_id == std.id,
                            StandardClause.clause_number == c_data["clause_number"]
                        )
                    )
                    if check_res.scalars().first():
                        continue

                    clause = StandardClause(
                        id=str(uuid.uuid4()),
                        standard_id=std.id,
                        standard_number=std.standard_number,
                        clause_number=c_data["clause_number"],
                        clause_title=c_data["clause_title"],
                        clause_text=c_data["clause_text"],
                        key_tolerances=c_data["key_tolerances"],
                    )
                    session.add(clause)
                    inserted_count += 1

        await session.commit()
        print(f"[OK] Successfully seeded {inserted_count} technical clauses across Indian Standards!")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_clauses())
