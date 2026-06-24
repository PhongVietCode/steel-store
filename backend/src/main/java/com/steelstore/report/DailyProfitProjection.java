package com.steelstore.report;

import java.time.LocalDate;

public interface DailyProfitProjection {
    LocalDate getDay();
    Long getRevenue();
    Long getCost();
}
