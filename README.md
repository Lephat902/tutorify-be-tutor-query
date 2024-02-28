## Tutor Query Service

### Overview
The Tutor Query Service is a dedicated microservice designed to handle all operations related to querying tutors within our system.

### Responsibilities
1. **Tutor Query Operations:** The primary responsibility of this service is to facilitate efficient and comprehensive queries related to tutors.
   
### Need for Dedicated Service
While it may seem feasible to utilize the `auth` service for tutor queries, several factors necessitate the existence of a dedicated service:
- **Preventing Overload:** Utilizing the `auth` service for tutor queries can lead to potential overload, as it is primarily designed for authentication purposes.
- **Comprehensive Queries:** The `auth` service lacks the necessary information required for comprehensive tutor queries, such as tutor proficiencies.
  
### Design Inspiration
The design of the Tutor Query Service is inspired by the Command Query Responsibility Segregation (CQRS) pattern. It follows the principle of separation of concerns by focusing solely on query operations, without providing endpoints for mutating its state. Instead, it listens for changes from other services to update its state accordingly.

By adopting this approach, we ensure scalability, maintainability, and efficient handling of tutor-related queries within our system.
