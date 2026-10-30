package com.finos.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    private Long userId;

    private String fullName;
    private String city;
    private String occupation;
    private Double monthlyIncome = 0.0;
    private Double monthlyRent = 0.0;
    private Double monthlyEmi = 0.0;
    private Integer familyMembers = 1;
    private Double monthlySavings = 0.0;
    private String financialGoal;
    private String preferredLanguage = "en";
    private String currency = "₹";
    private Boolean onboardingCompleted = false;

    public Profile() {}

    public Profile(Long userId, String fullName) {
        this.userId = userId;
        this.fullName = fullName;
        this.onboardingCompleted = false;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public Double getMonthlyIncome() { return monthlyIncome; }
    public void setMonthlyIncome(Double monthlyIncome) { this.monthlyIncome = monthlyIncome; }

    public Double getMonthlyRent() { return monthlyRent; }
    public void setMonthlyRent(Double monthlyRent) { this.monthlyRent = monthlyRent; }

    public Double getMonthlyEmi() { return monthlyEmi; }
    public void setMonthlyEmi(Double monthlyEmi) { this.monthlyEmi = monthlyEmi; }

    public Integer getFamilyMembers() { return familyMembers; }
    public void setFamilyMembers(Integer familyMembers) { this.familyMembers = familyMembers; }

    public Double getMonthlySavings() { return monthlySavings; }
    public void setMonthlySavings(Double monthlySavings) { this.monthlySavings = monthlySavings; }

    public String getFinancialGoal() { return financialGoal; }
    public void setFinancialGoal(String financialGoal) { this.financialGoal = financialGoal; }

    public String getPreferredLanguage() { return preferredLanguage; }
    public void setPreferredLanguage(String preferredLanguage) { this.preferredLanguage = preferredLanguage; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public Boolean getOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(Boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }
}
