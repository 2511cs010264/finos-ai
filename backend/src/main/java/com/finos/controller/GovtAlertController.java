package com.finos.controller;

import com.finos.entity.GovtAlert;
import com.finos.repository.GovtAlertRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/govt-alerts")
public class GovtAlertController {

    private final GovtAlertRepository govtAlertRepository;

    public GovtAlertController(GovtAlertRepository govtAlertRepository) {
        this.govtAlertRepository = govtAlertRepository;
        initDefaultAlerts();
    }

    private void initDefaultAlerts() {
        if (govtAlertRepository.count() == 0) {
            govtAlertRepository.saveAll(List.of(
                new GovtAlert("LPG Domestic Cylinder Price Reduced by ₹50", "LPG", LocalDate.now().minusDays(5), "success", "Government announced a ₹50 reduction on 14.2kg domestic LPG cylinders starting this month."),
                new GovtAlert("RBI Keeps Repo Rate Unchanged at 6.5%", "RBI Updates", LocalDate.now().minusDays(10), "info", "Monetary Policy Committee maintains repo rate. Home and car loan EMIs remain stable for Q3."),
                new GovtAlert("Electricity Tariff Revision: 4% Surcharge in Peak Hours", "Electricity", LocalDate.now().minusDays(15), "warning", "State electricity board introduces Time-of-Day pricing between 6 PM - 10 PM."),
                new GovtAlert("Retail Inflation Drops to 4.75%", "Inflation News", LocalDate.now().minusDays(20), "success", "CPI inflation moderates, bringing relief to grocery expenditure.")
            ));
        }
    }

    @GetMapping
    public ResponseEntity<List<GovtAlert>> getAlerts() {
        return ResponseEntity.ok(govtAlertRepository.findAllByOrderByDateDesc());
    }
}
