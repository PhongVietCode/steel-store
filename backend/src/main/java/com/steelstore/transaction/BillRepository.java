package com.steelstore.transaction;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BillRepository
        extends JpaRepository<Bill, Long>, JpaSpecificationExecutor<Bill> {

    @EntityGraph(attributePaths = {"lines", "lines.product"})
    Optional<Bill> findByIdempotencyKey(UUID idempotencyKey);

    @EntityGraph(attributePaths = {"lines", "lines.product"})
    Optional<Bill> findWithLinesById(Long id);

    Optional<Bill> findByCorrectionOfBill_Id(Long sourceBillId);

    List<Bill> findAllByCorrectionOfBill_IdIn(List<Long> sourceBillIds);
}
