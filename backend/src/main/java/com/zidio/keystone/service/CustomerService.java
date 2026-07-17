package com.zidio.keystone.service;

import com.zidio.keystone.domain.Customer;
import com.zidio.keystone.domain.Site;
import com.zidio.keystone.dto.CustomerDtos;
import com.zidio.keystone.dto.SiteDtos;
import com.zidio.keystone.exception.AccessForbiddenException;
import com.zidio.keystone.exception.ResourceNotFoundException;
import com.zidio.keystone.repository.CustomerRepository;
import com.zidio.keystone.repository.SiteRepository;
import com.zidio.keystone.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final SiteRepository siteRepository;

    @Transactional(readOnly = true)
    public Page<CustomerDtos.CustomerResponse> list(String search, Pageable pageable) {
        Page<Customer> page = (search == null || search.isBlank())
                ? customerRepository.findAll(pageable)
                : customerRepository.findByNameContainingIgnoreCase(search, pageable);
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public CustomerDtos.CustomerResponse get(Long id) {
        return toResponse(findCustomerOrThrow(id));
    }

    @Transactional
    public CustomerDtos.CustomerResponse create(CustomerDtos.CustomerRequest request) {
        Customer customer = Customer.builder()
                .name(request.name())
                .contactEmail(request.contactEmail())
                .phone(request.phone())
                .build();
        return toResponse(customerRepository.save(customer));
    }

    @Transactional
    public CustomerDtos.CustomerResponse update(Long id, CustomerDtos.CustomerRequest request) {
        Customer customer = findCustomerOrThrow(id);
        customer.setName(request.name());
        customer.setContactEmail(request.contactEmail());
        customer.setPhone(request.phone());
        return toResponse(customerRepository.save(customer));
    }

    @Transactional(readOnly = true)
    public List<SiteDtos.SiteResponse> listSites(Long customerId, UserPrincipal principal) {
        assertCanAccessCustomer(customerId, principal);
        return siteRepository.findByCustomerId(customerId).stream().map(this::toSiteResponse).toList();
    }

    @Transactional
    public SiteDtos.SiteResponse createSite(SiteDtos.SiteRequest request) {
        Customer customer = findCustomerOrThrow(request.customerId());
        Site site = Site.builder()
                .customer(customer)
                .name(request.name())
                .address(request.address())
                .build();
        return toSiteResponse(siteRepository.save(site));
    }

    @Transactional
    public SiteDtos.SiteResponse updateSite(Long id, SiteDtos.SiteRequest request) {
        Site site = siteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Site " + id + " not found."));
        Customer customer = findCustomerOrThrow(request.customerId());
        site.setCustomer(customer);
        site.setName(request.name());
        site.setAddress(request.address());
        return toSiteResponse(siteRepository.save(site));
    }

    /** A CUSTOMER-role user may only ever see their own organisation's sites. */
    public void assertCanAccessCustomer(Long customerId, UserPrincipal principal) {
        if ("CUSTOMER".equals(principal.getRole()) && !customerId.equals(principal.getCustomerId())) {
            throw new AccessForbiddenException("You may only view your own organisation's data.");
        }
    }

    Customer findCustomerOrThrow(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer " + id + " not found."));
    }

    private CustomerDtos.CustomerResponse toResponse(Customer c) {
        long siteCount = siteRepository.findByCustomerId(c.getId()).size();
        return new CustomerDtos.CustomerResponse(c.getId(), c.getName(), c.getContactEmail(), c.getPhone(), c.getCreatedAt(), siteCount);
    }

    private SiteDtos.SiteResponse toSiteResponse(Site s) {
        return new SiteDtos.SiteResponse(s.getId(), s.getCustomer().getId(), s.getCustomer().getName(), s.getName(), s.getAddress(), s.getCreatedAt());
    }
}
