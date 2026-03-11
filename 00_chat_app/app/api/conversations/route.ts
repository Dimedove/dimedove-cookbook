import { NextRequest, NextResponse } from "next/server";
import {
  listConversations,
  listUserConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
} from "@/lib/dimedove-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");

    if (id) {
      const conversation = await getConversation(id);
      return NextResponse.json(conversation);
    }

    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const order = (searchParams.get("order") || "desc") as "asc" | "desc";
    const after = searchParams.get("after") || undefined;
    const before = searchParams.get("before") || undefined;

    const externalUserId = searchParams.get("external_user_id");
    if (externalUserId) {
      const data = await listUserConversations(externalUserId, limit, order, after, before);
      return NextResponse.json(data);
    }

    const data = await listConversations(limit, order, after, before);
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/conversations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.external_user_id) {
      return NextResponse.json(
        { error: "Missing external_user_id" },
        { status: 400 },
      );
    }
    const conversation = await createConversation(body);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("POST /api/conversations error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing conversation id" },
        { status: 400 },
      );
    }
    await deleteConversation(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("DELETE /api/conversations error:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing conversation id" },
        { status: 400 },
      );
    }
    const body = await req.json();
    const conversation = await updateConversation(id, body);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("PATCH /api/conversations error:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 },
    );
  }
}
