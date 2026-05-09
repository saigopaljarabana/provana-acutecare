import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const drug = searchParams.get("drug") ?? "";
  const allergy = searchParams.get("allergy") ?? "";

  if (!drug) {
    return NextResponse.json({ error: "drug param required" }, { status: 400 });
  }

  try {
    const query = encodeURIComponent(`openfda.generic_name:"${drug.toLowerCase()}"`);
    const res = await fetch(
      `https://api.fda.gov/drug/label.json?search=${query}&limit=1`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return NextResponse.json({ drug, allergy, source: "OpenFDA", found: false, error: "Not found in FDA database" });
    }

    const data = await res.json();
    const label = data?.results?.[0];

    if (!label) {
      return NextResponse.json({ drug, allergy, source: "OpenFDA", found: false });
    }

    const contraindications: string = label.contraindications?.[0] ?? "";
    const warnings: string = label.warnings?.[0] ?? label.warnings_and_cautions?.[0] ?? "";
    const interactions: string = label.drug_interactions?.[0] ?? "";

    // Check if the allergy drug appears in warnings/contraindications
    const allergyLower = allergy.toLowerCase();
    const relevant =
      contraindications.toLowerCase().includes(allergyLower) ||
      warnings.toLowerCase().includes(allergyLower) ||
      interactions.toLowerCase().includes(allergyLower);

    return NextResponse.json({
      drug,
      allergy,
      source: "OpenFDA",
      found: true,
      relevant,
      contraindications: contraindications.slice(0, 400) || null,
      warnings: warnings.slice(0, 400) || null,
      interactions: interactions.slice(0, 400) || null,
    });
  } catch {
    return NextResponse.json({ drug, allergy, source: "OpenFDA", found: false, error: "FDA API unavailable" });
  }
}
