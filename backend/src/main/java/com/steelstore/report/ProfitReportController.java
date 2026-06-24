package com.steelstore.report;

import com.steelstore.report.dto.ProfitReportResponse;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ProfitReportController {

    private final ProfitReportService service;

    public ProfitReportController(ProfitReportService service) {
        this.service = service;
    }

    @GetMapping("/profit")
    public ProfitReportResponse profit(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.profit(from, to);
    }
}
