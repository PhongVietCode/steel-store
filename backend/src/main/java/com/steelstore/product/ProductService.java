package com.steelstore.product;

import com.steelstore.product.dto.CreateProductRequest;
import com.steelstore.product.dto.ProductResponse;
import com.steelstore.product.dto.UpdateProductRequest;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> list(String nameFilter) {
        List<Product> products = (nameFilter == null || nameFilter.isBlank())
                ? repository.findAllByOrderByNameAsc()
                : repository.findByNameContainingIgnoreCaseOrderByNameAsc(nameFilter.trim());
        return products.stream().map(ProductResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse get(Long id) {
        return ProductResponse.from(load(id));
    }

    public ProductResponse create(CreateProductRequest req) {
        Product p = new Product(
                req.name().trim(),
                req.unit().trim(),
                req.currentImportPrice(),
                req.currentSellingPrice(),
                req.currentStock()
        );
        return ProductResponse.from(repository.save(p));
    }

    public ProductResponse update(Long id, UpdateProductRequest req) {
        Product p = load(id);
        p.setName(req.name().trim());
        p.setUnit(req.unit().trim());
        p.setCurrentImportPrice(req.currentImportPrice());
        p.setCurrentSellingPrice(req.currentSellingPrice());
        return ProductResponse.from(repository.saveAndFlush(p));
    }

    public void delete(Long id) {
        Product p = load(id);
        repository.delete(p);
    }

    private Product load(Long id) {
        return repository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
    }
}
