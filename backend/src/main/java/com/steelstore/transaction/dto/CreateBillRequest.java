package com.steelstore.transaction.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import java.util.List;

public record CreateBillRequest(
        @Size(max = 200) String partyName,
        OffsetDateTime occurredAt,
        @NotEmpty @Size(max = 200) List<@Valid BillLineRequest> lines
) {}
