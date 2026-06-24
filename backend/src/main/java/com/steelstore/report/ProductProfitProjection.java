package com.steelstore.report;

public interface ProductProfitProjection {
    Long getProductId();
    String getName();
    Long getQtySold();
    Long getRevenue();
    Long getCost();
}
