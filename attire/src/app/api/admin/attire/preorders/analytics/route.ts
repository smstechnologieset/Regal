import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/admin/attire/preorders/analytics
 * 
 * Calculate pre-order analytics and metrics
 * - Total active pre-orders
 * - Pre-orders grouped by product
 * - Average wait time
 * - Conversion rate (fulfilled vs cancelled)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get total active pre-orders (pending + ready)
    const { data: activePreorders, error: activeError } = await supabase
      .from("order_items")
      .select("id, quantity, preorder_status")
      .eq("is_preorder", true)
      .in("preorder_status", ["pending", "ready"]);

    if (activeError) throw activeError;

    const totalActivePreorders = activePreorders?.reduce(
      (sum, item) => sum + item.quantity,
      0
    ) || 0;

    // 2. Get pre-orders grouped by product
    const { data: productPreorders, error: productError } = await supabase
      .from("order_items")
      .select(`
        product_id,
        product_name,
        quantity,
        preorder_status,
        products!inner(name, stock, estimated_restock_date)
      `)
      .eq("is_preorder", true)
      .in("preorder_status", ["pending", "ready"]);

    if (productError) throw productError;

    // Group by product
    const productMap = new Map<string, {
      productId: string;
      productName: string;
      totalQuantity: number;
      pendingCount: number;
      readyCount: number;
      estimatedRestockDate?: string;
      currentStock: number;
    }>();

    productPreorders?.forEach((item: any) => {
      const productId = item.product_id;
      const existing = productMap.get(productId);
      
      if (existing) {
        existing.totalQuantity += item.quantity;
        if (item.preorder_status === "pending") {
          existing.pendingCount += item.quantity;
        } else if (item.preorder_status === "ready") {
          existing.readyCount += item.quantity;
        }
      } else {
        productMap.set(productId, {
          productId,
          productName: item.product_name || item.products?.name || "Unknown",
          totalQuantity: item.quantity,
          pendingCount: item.preorder_status === "pending" ? item.quantity : 0,
          readyCount: item.preorder_status === "ready" ? item.quantity : 0,
          estimatedRestockDate: item.products?.estimated_restock_date,
          currentStock: item.products?.stock || 0,
        });
      }
    });

    const preordersByProduct = Array.from(productMap.values()).sort(
      (a, b) => b.totalQuantity - a.totalQuantity
    );

    // 3. Calculate average wait time (for fulfilled orders)
    const { data: fulfilledPreorders, error: fulfilledError } = await supabase
      .from("order_items")
      .select("created_at, preorder_status, estimated_delivery_date")
      .eq("is_preorder", true)
      .eq("preorder_status", "fulfilled");

    if (fulfilledError) throw fulfilledError;

    let averageWaitDays = 0;
    if (fulfilledPreorders && fulfilledPreorders.length > 0) {
      const totalWaitDays = fulfilledPreorders.reduce((sum, item) => {
        const createdDate = new Date(item.created_at);
        const deliveryDate = item.estimated_delivery_date
          ? new Date(item.estimated_delivery_date)
          : new Date(); // Use current date if no delivery date
        const waitDays = Math.floor(
          (deliveryDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + Math.max(0, waitDays);
      }, 0);
      averageWaitDays = Math.round(totalWaitDays / fulfilledPreorders.length);
    }

    // 4. Calculate conversion rate (fulfilled vs cancelled)
    const { data: allCompletedPreorders, error: completedError } = await supabase
      .from("order_items")
      .select("preorder_status, quantity")
      .eq("is_preorder", true)
      .in("preorder_status", ["fulfilled", "cancelled"]);

    if (completedError) throw completedError;

    let fulfilledCount = 0;
    let cancelledCount = 0;

    allCompletedPreorders?.forEach((item) => {
      if (item.preorder_status === "fulfilled") {
        fulfilledCount += item.quantity;
      } else if (item.preorder_status === "cancelled") {
        cancelledCount += item.quantity;
      }
    });

    const totalCompleted = fulfilledCount + cancelledCount;
    const conversionRate = totalCompleted > 0
      ? Math.round((fulfilledCount / totalCompleted) * 100)
      : 0;

    // 5. Get pending pre-orders count
    const { data: pendingPreorders, error: pendingError } = await supabase
      .from("order_items")
      .select("quantity")
      .eq("is_preorder", true)
      .eq("preorder_status", "pending");

    if (pendingError) throw pendingError;

    const totalPendingPreorders = pendingPreorders?.reduce(
      (sum, item) => sum + item.quantity,
      0
    ) || 0;

    // 6. Get ready pre-orders count
    const { data: readyPreorders, error: readyError } = await supabase
      .from("order_items")
      .select("quantity")
      .eq("is_preorder", true)
      .eq("preorder_status", "ready");

    if (readyError) throw readyError;

    const totalReadyPreorders = readyPreorders?.reduce(
      (sum, item) => sum + item.quantity,
      0
    ) || 0;

    return NextResponse.json({
      success: true,
      analytics: {
        totalActivePreorders,
        totalPendingPreorders,
        totalReadyPreorders,
        preordersByProduct,
        averageWaitDays,
        conversionRate,
        fulfilledCount,
        cancelledCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching pre-order analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
