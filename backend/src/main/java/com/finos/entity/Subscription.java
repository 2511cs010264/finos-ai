package com.finos.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Double monthlyCost;

    private Double annualCost;
    private String billingCycle;
    private LocalDate nextRenewalDate;
    private Boolean isUsedRegularly = true;
    private String category;

    public Subscription() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getMonthlyCost() { return monthlyCost; }
    public void setMonthlyCost(Double monthlyCost) { this.monthlyCost = monthlyCost; }

    public Double getAnnualCost() { return annualCost; }
    public void setAnnualCost(Double annualCost) { this.annualCost = annualCost; }

    public String getBillingCycle() { return billingCycle; }
    public void setBillingCycle(String billingCycle) { this.billingCycle = billingCycle; }

    public LocalDate getNextRenewalDate() { return nextRenewalDate; }
    public void setNextRenewalDate(LocalDate nextRenewalDate) { this.nextRenewalDate = nextRenewalDate; }

    public Boolean getIsUsedRegularly() { return isUsedRegularly; }
    public void setIsUsedRegularly(Boolean isUsedRegularly) { this.isUsedRegularly = isUsedRegularly; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
