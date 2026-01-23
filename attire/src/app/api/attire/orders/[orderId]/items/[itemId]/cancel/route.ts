import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/attire/orders/:orderId/items/:itemId/cancel
 * 
 * Cancel a pre-order item
 * - Updates item preorder_status to 'cancelled'
 * - Recalculates order preorder_status
 * - Updates order status if all items cancelled
 * - Decrements product preorder_count
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string; itemId: string }> }
) {
  try {
    const { orderId, itemId } = await params;

    if (!orderId || !itemId) {
      return NextResponse.json(
        { error: "Order ID and Item ID are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch the order item
    const { data: item, error: itemError } = await supabase
      .from("order_items")
      .select("*")
      .eq("id", itemId)
      .eq("order_id", orderId)
      .single();

    if (itemError || !item) {
      return NextResponse.json(
        { error: "Order item not found" },
        { status: 404 }
      );
    }

    // 2. Validate that it's a pre-order and status is pending
    if (!item.is_preorder) {
      return NextResponse.json(
        { error: "This item is not a pre-order" },
        { status: 400 }
      );
    }

    if (item.preorder_status !== "pending") {
      return NextResponse.json(
        { error: `Cannot cancel pre-order with status: ${item.preorder_status}` },
        { status: 400 }
      );
    }

    // 3. Update item status to cancelled
    const { error: updateItemError } = await supabase
      .from("order_items")
      .update({ preorder_status: "cancelled" })
      .eq("id", itemId);

    if (updateItemError) {
      throw updateItemError;
    }

    // Note: Product preorder_count is automatically decremented by database trigger

    // 4. Recalculate order preorder_status
    const { data: allItems, error: allItemsError } = await supabase
      .from("order_items")
      .select("is_preorder, preorder_status")
      .eq("order_id", orderId);

    if (allItemsError) {
      throw allItemsError;
    }

    // Calculate new preorder status
    const preorderItems = allItems.filter((i) => i.is_preorder);
    const activePreorders = preorderItems.filter(
      (i) => i.preorder_status !== "cancelled"
    );
    const regularItems = allItems.filter((i) => !i.is_preorder);

    let newPreorderStatus = "none";
    let newOrderStatus = null;

    if (activePreorders.length === 0 && preorderItems.length > 0) {
      // All pre-orders cancelled
      if (regularItems.length === 0) {
        // No regular items, entire order is cancelled
        newOrderStatus = "cancelled";
        newPreorderStatus = "none";
      } else {
        // Has regular items, order continues
        newPreorderStatus = "none";
      }
    } else if (activePreorders.length > 0) {
      if (regularItems.length > 0) {
        newPreorderStatus = "partial";
      } else {
        newPreorderStatus = "all";
      }
    }

    // 5. Update order
    const orderUpdate: any = {
      preorder_status: newPreorderStatus,
      has_preorders: activePreorders.length > 0,
    };

    if (newOrderStatus) {
      orderUpdate.status = newOrderStatus;
    }

    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from("orders")
      .update(orderUpdate)
      .eq("id", orderId)
      .select()
      .single();

    if (orderUpdateError) {
      throw orderUpdateError;
    }

    return NextResponse.json({
      success: true,
      message: "Pre-order cancelled successfully",
      item: { id: itemId, preorder_status: "cancelled" },
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Error cancelling pre-order:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel pre-order" },
      { status: 500 }
    );
  }
}
