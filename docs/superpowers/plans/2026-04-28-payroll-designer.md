# Payroll Designer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React visual editor (b4rrhh_designer) backed by new CRUD API endpoints in b4rrhh_backend, allowing payroll configurators to design the concept catalog — types, operand wiring, feed relations, and assignment rules — without writing SQL or code.

**Architecture:** Phase 1 adds CRUD management endpoints to b4rrhh_backend following existing hexagonal patterns (use case → service → repository → JPA). Phase 2 creates a new Vite + React app in a sibling repo `b4rrhh_designer` with React Flow as the canvas engine, React Query for server state, and Zustand for local canvas state.

**Tech Stack:** Java 21 + Spring Boot (backend) · React 18 + Vite + React Flow + shadcn/ui + Tailwind + Zustand + React Query (frontend)

---

## Phase 1 — Backend: Payroll Engine Management API

### Task 1: OpenAPI — schema y endpoints de gestión del motor

**Files:**
- Modify: `b4rrhh_backend/openapi/personnel-administration-api.yaml`

Añadir al final del fichero los siguientes bloques (antes del cierre de `paths:`):

- [ ] **Step 1: Añadir schemas de request/response para PayrollConcept**

```yaml
# En components/schemas:

CreatePayrollConceptRequest:
  type: object
  required: [conceptCode, conceptMnemonic, calculationType, functionalNature, resultCompositionMode, executionScope]
  properties:
    conceptCode:
      type: string
      example: "201"
    conceptMnemonic:
      type: string
      example: "PLUS_TRANSPORTE"
    calculationType:
      type: string
      enum: [DIRECT_AMOUNT, RATE_BY_QUANTITY, PERCENTAGE, AGGREGATE, JAVA_PROVIDED]
    functionalNature:
      type: string
      enum: [EARNING, DEDUCTION, BASE, INFORMATIONAL, TECHNICAL, TOTAL_EARNING, TOTAL_DEDUCTION, NET_PAY]
    resultCompositionMode:
      type: string
      enum: [REPLACE, ACCUMULATE]
    executionScope:
      type: string
      enum: [SEGMENT, PERIOD]
    payslipOrderCode:
      type: string
      nullable: true

PayrollConceptDesignerResponse:
  type: object
  properties:
    ruleSystemCode:
      type: string
    conceptCode:
      type: string
    conceptMnemonic:
      type: string
    calculationType:
      type: string
    functionalNature:
      type: string
    resultCompositionMode:
      type: string
    executionScope:
      type: string
    payslipOrderCode:
      type: string
      nullable: true

UpdateConceptOperandsRequest:
  type: object
  required: [operands]
  properties:
    operands:
      type: array
      items:
        type: object
        required: [operandRole, sourceObjectCode]
        properties:
          operandRole:
            type: string
            enum: [QUANTITY, RATE, BASE, PERCENTAGE]
          sourceObjectCode:
            type: string

UpdateConceptFeedsRequest:
  type: object
  required: [feeds]
  properties:
    feeds:
      type: array
      items:
        type: object
        required: [sourceObjectCode, invertSign, effectiveFrom]
        properties:
          sourceObjectCode:
            type: string
          invertSign:
            type: boolean
          effectiveFrom:
            type: string
            format: date
          effectiveTo:
            type: string
            format: date
            nullable: true

ConceptOperandResponse:
  type: object
  properties:
    operandRole:
      type: string
    sourceObjectCode:
      type: string

ConceptFeedResponse:
  type: object
  properties:
    sourceObjectCode:
      type: string
    invertSign:
      type: boolean
    effectiveFrom:
      type: string
      format: date
    effectiveTo:
      type: string
      format: date
      nullable: true

CreateConceptAssignmentRequest:
  type: object
  required: [conceptCode, validFrom, priority]
  properties:
    conceptCode:
      type: string
    companyCode:
      type: string
      nullable: true
    agreementCode:
      type: string
      nullable: true
    employeeTypeCode:
      type: string
      nullable: true
    validFrom:
      type: string
      format: date
    validTo:
      type: string
      format: date
      nullable: true
    priority:
      type: integer

ConceptAssignmentResponse:
  type: object
  properties:
    id:
      type: integer
      format: int64
    ruleSystemCode:
      type: string
    conceptCode:
      type: string
    companyCode:
      type: string
      nullable: true
    agreementCode:
      type: string
      nullable: true
    employeeTypeCode:
      type: string
      nullable: true
    validFrom:
      type: string
      format: date
    validTo:
      type: string
      format: date
      nullable: true
    priority:
      type: integer
```

- [ ] **Step 2: Añadir paths para PayrollConcept**

```yaml
# En paths:

/payroll-engine/{ruleSystemCode}/concepts:
  get:
    tags: [payroll-engine]
    summary: List all concepts for a rule system
    operationId: listPayrollConcepts
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: OK
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/PayrollConceptDesignerResponse'
  post:
    tags: [payroll-engine]
    summary: Create a payroll concept
    operationId: createPayrollConcept
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreatePayrollConceptRequest'
    responses:
      '201':
        description: Created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PayrollConceptDesignerResponse'
      '409':
        description: Concept already exists

/payroll-engine/{ruleSystemCode}/concepts/{conceptCode}:
  delete:
    tags: [payroll-engine]
    summary: Delete a payroll concept
    operationId: deletePayrollConcept
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
      - name: conceptCode
        in: path
        required: true
        schema:
          type: string
    responses:
      '204':
        description: Deleted
      '404':
        description: Not found

/payroll-engine/{ruleSystemCode}/concepts/{conceptCode}/operands:
  get:
    tags: [payroll-engine]
    operationId: listConceptOperands
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
      - name: conceptCode
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: OK
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/ConceptOperandResponse'
  put:
    tags: [payroll-engine]
    operationId: replaceConceptOperands
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
      - name: conceptCode
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateConceptOperandsRequest'
    responses:
      '200':
        description: OK
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/ConceptOperandResponse'

/payroll-engine/{ruleSystemCode}/concepts/{conceptCode}/feeds:
  get:
    tags: [payroll-engine]
    operationId: listConceptFeeds
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
      - name: conceptCode
        in: path
        required: true
        schema:
          type: string
    responses:
      '200':
        description: OK
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/ConceptFeedResponse'
  put:
    tags: [payroll-engine]
    operationId: replaceConceptFeeds
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
      - name: conceptCode
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/UpdateConceptFeedsRequest'
    responses:
      '200':
        description: OK

/payroll-engine/{ruleSystemCode}/assignments:
  get:
    tags: [payroll-engine]
    operationId: listConceptAssignments
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
      - name: conceptCode
        in: query
        schema:
          type: string
    responses:
      '200':
        description: OK
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/ConceptAssignmentResponse'
  post:
    tags: [payroll-engine]
    operationId: createConceptAssignment
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
    requestBody:
      required: true
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/CreateConceptAssignmentRequest'
    responses:
      '201':
        description: Created
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ConceptAssignmentResponse'

/payroll-engine/{ruleSystemCode}/assignments/{assignmentId}:
  delete:
    tags: [payroll-engine]
    operationId: deleteConceptAssignment
    security:
      - bearerAuth: []
    parameters:
      - name: ruleSystemCode
        in: path
        required: true
        schema:
          type: string
      - name: assignmentId
        in: path
        required: true
        schema:
          type: integer
          format: int64
    responses:
      '204':
        description: Deleted
      '404':
        description: Not found
```

- [ ] **Step 3: Verificar que el YAML es válido**

```bash
cd b4rrhh_backend
# Si tienes swagger-cli instalado:
npx @apidevtools/swagger-cli validate openapi/personnel-administration-api.yaml
# O simplemente arrancar el backend y verificar que no hay errores de parseo OpenAPI
```

- [ ] **Step 4: Commit**

```bash
git add openapi/personnel-administration-api.yaml
git commit -m "feat(openapi): add payroll engine management endpoints"
```

---

### Task 2: Ampliar repositorios — findAll y delete

**Files:**
- Modify: `src/main/java/com/b4rrhh/payroll_engine/concept/domain/port/PayrollConceptRepository.java`
- Modify: `src/main/java/com/b4rrhh/payroll_engine/concept/infrastructure/persistence/SpringDataPayrollConceptRepository.java`
- Modify: `src/main/java/com/b4rrhh/payroll_engine/concept/infrastructure/persistence/PayrollConceptPersistenceAdapter.java`
- Modify: `src/main/java/com/b4rrhh/payroll_engine/eligibility/domain/port/ConceptAssignmentRepository.java`
- Modify: `src/main/java/com/b4rrhh/payroll_engine/eligibility/infrastructure/persistence/SpringDataConceptAssignmentRepository.java` (o equivalente)
- Modify: `src/main/java/com/b4rrhh/payroll_engine/eligibility/infrastructure/persistence/ConceptAssignmentPersistenceAdapter.java`

- [ ] **Step 1: Escribir el test de repositorio para findAll**

Crear `src/test/java/com/b4rrhh/payroll_engine/concept/domain/port/PayrollConceptRepositoryFindAllTest.java`:

```java
@SpringBootTest
@Transactional
class PayrollConceptRepositoryFindAllTest {

    @Autowired
    private PayrollConceptRepository repository;

    @Test
    void findAllByRuleSystemCode_returnsSeedConceptsForES() {
        List<PayrollConcept> concepts = repository.findAllByRuleSystemCode("ES");

        assertThat(concepts).isNotEmpty();
        assertThat(concepts).allMatch(c -> c.getRuleSystemCode().equals("ES"));
    }

    @Test
    void findAllByRuleSystemCode_returnsEmptyForUnknownSystem() {
        List<PayrollConcept> concepts = repository.findAllByRuleSystemCode("UNKNOWN");

        assertThat(concepts).isEmpty();
    }
}
```

- [ ] **Step 2: Ejecutar test — verificar FAIL**

```bash
cd b4rrhh_backend
mvn test -Dtest=PayrollConceptRepositoryFindAllTest -pl . 2>&1 | tail -20
```
Esperado: `FAIL` — método `findAllByRuleSystemCode` no existe.

- [ ] **Step 3: Añadir `findAllByRuleSystemCode` al port**

En `PayrollConceptRepository.java`:
```java
List<PayrollConcept> findAllByRuleSystemCode(String ruleSystemCode);
```

- [ ] **Step 4: Implementar en SpringData y adapter**

En `SpringDataPayrollConceptRepository.java`:
```java
@Query("""
    select c from PayrollEngineConceptEntity c
    where c.payrollObject.ruleSystemCode = :ruleSystemCode
      and c.payrollObject.objectTypeCode = 'CONCEPT'
    order by c.payrollObject.objectCode
    """)
List<PayrollConceptEntity> findAllByRuleSystemCode(@Param("ruleSystemCode") String ruleSystemCode);
```

En `PayrollConceptPersistenceAdapter.java` (sigue el patrón existente del adapter):
```java
@Override
public List<PayrollConcept> findAllByRuleSystemCode(String ruleSystemCode) {
    return springDataRepo.findAllByRuleSystemCode(ruleSystemCode)
        .stream()
        .map(mapper::toDomain)
        .toList();
}
```

- [ ] **Step 5: Escribir test para delete**

En el mismo fichero de test, añadir:
```java
@Test
void deleteByBusinessKey_removesConceptFromRepository() {
    // El concepto 101 existe por los seeds
    repository.deleteByBusinessKey("ES", "101");

    assertThat(repository.existsByBusinessKey("ES", "101")).isFalse();
}

@Test
void deleteByBusinessKey_noOpForNonExistentConcept() {
    // No debe lanzar excepción
    assertThatNoException().isThrownBy(
        () -> repository.deleteByBusinessKey("ES", "NONEXISTENT")
    );
}
```

- [ ] **Step 6: Implementar delete en port, SpringData y adapter**

Port:
```java
void deleteByBusinessKey(String ruleSystemCode, String conceptCode);
```

SpringData (el JpaRepository ya tiene `deleteById` — añadir):
```java
@Modifying
@Query("""
    delete from PayrollEngineConceptEntity c
    where c.payrollObject.ruleSystemCode = :ruleSystemCode
      and c.payrollObject.objectCode = :conceptCode
      and c.payrollObject.objectTypeCode = 'CONCEPT'
    """)
void deleteByRuleSystemCodeAndConceptCode(
    @Param("ruleSystemCode") String ruleSystemCode,
    @Param("conceptCode") String conceptCode
);
```

Adapter:
```java
@Override
public void deleteByBusinessKey(String ruleSystemCode, String conceptCode) {
    springDataRepo.deleteByRuleSystemCodeAndConceptCode(ruleSystemCode, conceptCode);
}
```

- [ ] **Step 7: Añadir findAll y delete a ConceptAssignmentRepository**

Port — añadir:
```java
List<ConceptAssignment> findAllByRuleSystemCode(String ruleSystemCode);
List<ConceptAssignment> findAllByRuleSystemCodeAndConceptCode(String ruleSystemCode, String conceptCode);
void deleteById(Long id);
```

SpringData — añadir:
```java
@Query("select a from ConceptAssignmentEntity a where a.ruleSystemCode = :ruleSystemCode order by a.priority desc")
List<ConceptAssignmentEntity> findAllByRuleSystemCode(@Param("ruleSystemCode") String ruleSystemCode);

@Query("select a from ConceptAssignmentEntity a where a.ruleSystemCode = :ruleSystemCode and a.conceptCode = :conceptCode")
List<ConceptAssignmentEntity> findAllByRuleSystemCodeAndConceptCode(
    @Param("ruleSystemCode") String ruleSystemCode,
    @Param("conceptCode") String conceptCode
);
```

Adapter — delegar a `springDataRepo.deleteById(id)`.

- [ ] **Step 8: Ejecutar todos los tests — deben pasar**

```bash
mvn test -Dtest=PayrollConceptRepositoryFindAllTest
```
Esperado: todos PASS.

- [ ] **Step 9: Commit**

```bash
git add src/
git commit -m "feat(payroll-engine): add findAll and delete to concept and assignment repositories"
```

---

### Task 3: Use cases — CRUD de PayrollConcept

**Files:**
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/application/usecase/CreatePayrollConceptUseCase.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/application/usecase/CreatePayrollConceptCommand.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/application/service/CreatePayrollConceptService.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/application/usecase/DeletePayrollConceptUseCase.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/application/service/DeletePayrollConceptService.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/domain/exception/PayrollConceptNotFoundException.java`
- Create: `src/test/java/com/b4rrhh/payroll_engine/concept/application/service/CreatePayrollConceptServiceTest.java`
- Create: `src/test/java/com/b4rrhh/payroll_engine/concept/application/service/DeletePayrollConceptServiceTest.java`

- [ ] **Step 1: Escribir test de creación (failing)**

```java
// CreatePayrollConceptServiceTest.java
@ExtendWith(MockitoExtension.class)
class CreatePayrollConceptServiceTest {

    @Mock PayrollConceptRepository conceptRepository;
    @Mock PayrollObjectRepository objectRepository;
    @InjectMocks CreatePayrollConceptService service;

    @Test
    void createsConceptWhenCodeIsNew() {
        var command = new CreatePayrollConceptCommand(
            "ES", "201", "PLUS_TRANSPORTE",
            CalculationType.RATE_BY_QUANTITY, FunctionalNature.EARNING,
            ResultCompositionMode.ACCUMULATE, ExecutionScope.SEGMENT, "20"
        );
        when(conceptRepository.existsByBusinessKey("ES", "201")).thenReturn(false);
        var objectCaptor = ArgumentCaptor.forClass(PayrollObject.class);
        when(objectRepository.save(objectCaptor.capture())).thenAnswer(i -> i.getArguments()[0]);
        var conceptCaptor = ArgumentCaptor.forClass(PayrollConcept.class);
        when(conceptRepository.save(conceptCaptor.capture())).thenAnswer(i -> i.getArguments()[0]);

        service.create(command);

        var saved = conceptCaptor.getValue();
        assertThat(saved.getConceptCode()).isEqualTo("201");
        assertThat(saved.getCalculationType()).isEqualTo(CalculationType.RATE_BY_QUANTITY);
    }

    @Test
    void rejectsCreationWhenCodeAlreadyExists() {
        var command = new CreatePayrollConceptCommand(
            "ES", "101", "SALARIO_BASE",
            CalculationType.RATE_BY_QUANTITY, FunctionalNature.EARNING,
            ResultCompositionMode.ACCUMULATE, ExecutionScope.SEGMENT, null
        );
        when(conceptRepository.existsByBusinessKey("ES", "101")).thenReturn(true);

        assertThatThrownBy(() -> service.create(command))
            .isInstanceOf(PayrollConceptAlreadyExistsException.class);
    }
}
```

- [ ] **Step 2: Ejecutar test — verificar FAIL**

```bash
mvn test -Dtest=CreatePayrollConceptServiceTest
```

- [ ] **Step 3: Implementar `CreatePayrollConceptCommand`**

```java
package com.b4rrhh.payroll_engine.concept.application.usecase;

public record CreatePayrollConceptCommand(
    String ruleSystemCode,
    String conceptCode,
    String conceptMnemonic,
    CalculationType calculationType,
    FunctionalNature functionalNature,
    ResultCompositionMode resultCompositionMode,
    ExecutionScope executionScope,
    String payslipOrderCode
) {}
```

- [ ] **Step 4: Implementar `CreatePayrollConceptUseCase`**

```java
package com.b4rrhh.payroll_engine.concept.application.usecase;

public interface CreatePayrollConceptUseCase {
    PayrollConcept create(CreatePayrollConceptCommand command);
}
```

- [ ] **Step 5: Implementar `CreatePayrollConceptService`**

```java
@Service
public class CreatePayrollConceptService implements CreatePayrollConceptUseCase {

    private final PayrollConceptRepository conceptRepository;
    private final PayrollObjectRepository objectRepository;

    public CreatePayrollConceptService(
        PayrollConceptRepository conceptRepository,
        PayrollObjectRepository objectRepository
    ) {
        this.conceptRepository = conceptRepository;
        this.objectRepository = objectRepository;
    }

    @Override
    @Transactional
    public PayrollConcept create(CreatePayrollConceptCommand command) {
        if (conceptRepository.existsByBusinessKey(command.ruleSystemCode(), command.conceptCode())) {
            throw new PayrollConceptAlreadyExistsException(command.ruleSystemCode(), command.conceptCode());
        }
        var now = LocalDateTime.now();
        var object = new PayrollObject(
            command.ruleSystemCode(),
            PayrollObjectTypeCode.CONCEPT,
            command.conceptCode(),
            null, // displayOrder (optional)
            true,
            now,
            now
        );
        var savedObject = objectRepository.save(object);
        var concept = new PayrollConcept(
            savedObject,
            command.conceptMnemonic(),
            command.calculationType(),
            command.functionalNature(),
            command.resultCompositionMode(),
            command.payslipOrderCode(),
            command.executionScope(),
            now,
            now
        );
        return conceptRepository.save(concept);
    }
}
```

- [ ] **Step 6: Implementar `PayrollConceptNotFoundException`**

```java
public class PayrollConceptNotFoundException extends RuntimeException {
    public PayrollConceptNotFoundException(String ruleSystemCode, String conceptCode) {
        super("PayrollConcept not found: ruleSystemCode=" + ruleSystemCode + ", conceptCode=" + conceptCode);
    }
}
```

- [ ] **Step 7: Escribir test de delete (failing)**

```java
// DeletePayrollConceptServiceTest.java
@ExtendWith(MockitoExtension.class)
class DeletePayrollConceptServiceTest {

    @Mock PayrollConceptRepository conceptRepository;
    @InjectMocks DeletePayrollConceptService service;

    @Test
    void deletesExistingConcept() {
        when(conceptRepository.existsByBusinessKey("ES", "201")).thenReturn(true);

        service.delete("ES", "201");

        verify(conceptRepository).deleteByBusinessKey("ES", "201");
    }

    @Test
    void throwsNotFoundForUnknownConcept() {
        when(conceptRepository.existsByBusinessKey("ES", "999")).thenReturn(false);

        assertThatThrownBy(() -> service.delete("ES", "999"))
            .isInstanceOf(PayrollConceptNotFoundException.class);
    }
}
```

- [ ] **Step 8: Implementar `DeletePayrollConceptService`**

```java
@Service
public class DeletePayrollConceptService implements DeletePayrollConceptUseCase {

    private final PayrollConceptRepository conceptRepository;

    public DeletePayrollConceptService(PayrollConceptRepository conceptRepository) {
        this.conceptRepository = conceptRepository;
    }

    @Override
    @Transactional
    public void delete(String ruleSystemCode, String conceptCode) {
        if (!conceptRepository.existsByBusinessKey(ruleSystemCode, conceptCode)) {
            throw new PayrollConceptNotFoundException(ruleSystemCode, conceptCode);
        }
        conceptRepository.deleteByBusinessKey(ruleSystemCode, conceptCode);
    }
}
```

Interface:
```java
public interface DeletePayrollConceptUseCase {
    void delete(String ruleSystemCode, String conceptCode);
}
```

- [ ] **Step 9: Ejecutar tests — deben pasar**

```bash
mvn test -Dtest="CreatePayrollConceptServiceTest,DeletePayrollConceptServiceTest"
```

- [ ] **Step 10: Commit**

```bash
git add src/
git commit -m "feat(payroll-engine): add create and delete use cases for PayrollConcept"
```

---

### Task 4: Web layer — PayrollConcept controller

**Files:**
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/infrastructure/web/CreatePayrollConceptRequest.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/infrastructure/web/PayrollConceptDesignerResponse.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/infrastructure/web/PayrollConceptManagementAssembler.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/infrastructure/web/PayrollConceptManagementController.java`
- Create: `src/test/java/com/b4rrhh/payroll_engine/concept/infrastructure/web/PayrollConceptManagementControllerTest.java`

- [ ] **Step 1: Escribir test de integración del controller (failing)**

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PayrollConceptManagementControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "ADMIN")
    void listConcepts_returnsExistingConceptsForES() throws Exception {
        mockMvc.perform(get("/payroll-engine/ES/concepts")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", not(empty())))
            .andExpect(jsonPath("$[0].ruleSystemCode").value("ES"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createConcept_returns201WithCreatedConcept() throws Exception {
        var request = Map.of(
            "conceptCode", "201",
            "conceptMnemonic", "PLUS_TRANSPORTE",
            "calculationType", "RATE_BY_QUANTITY",
            "functionalNature", "EARNING",
            "resultCompositionMode", "ACCUMULATE",
            "executionScope", "SEGMENT"
        );

        mockMvc.perform(post("/payroll-engine/ES/concepts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.conceptCode").value("201"))
            .andExpect(jsonPath("$.calculationType").value("RATE_BY_QUANTITY"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createConcept_returns409WhenCodeAlreadyExists() throws Exception {
        var request = Map.of(
            "conceptCode", "101",
            "conceptMnemonic", "DUPLICATE",
            "calculationType", "DIRECT_AMOUNT",
            "functionalNature", "TECHNICAL",
            "resultCompositionMode", "REPLACE",
            "executionScope", "SEGMENT"
        );

        mockMvc.perform(post("/payroll-engine/ES/concepts")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict());
    }
}
```

- [ ] **Step 2: Ejecutar test — verificar FAIL**

```bash
mvn test -Dtest=PayrollConceptManagementControllerTest
```

- [ ] **Step 3: Implementar DTOs**

`CreatePayrollConceptRequest.java`:
```java
public record CreatePayrollConceptRequest(
    String conceptCode,
    String conceptMnemonic,
    String calculationType,
    String functionalNature,
    String resultCompositionMode,
    String executionScope,
    String payslipOrderCode
) {}
```

`PayrollConceptDesignerResponse.java`:
```java
public record PayrollConceptDesignerResponse(
    String ruleSystemCode,
    String conceptCode,
    String conceptMnemonic,
    String calculationType,
    String functionalNature,
    String resultCompositionMode,
    String executionScope,
    String payslipOrderCode
) {}
```

- [ ] **Step 4: Implementar assembler**

```java
@Component
public class PayrollConceptManagementAssembler {

    public PayrollConceptDesignerResponse toResponse(PayrollConcept concept) {
        return new PayrollConceptDesignerResponse(
            concept.getRuleSystemCode(),
            concept.getConceptCode(),
            concept.getConceptMnemonic(),
            concept.getCalculationType().name(),
            concept.getFunctionalNature().name(),
            concept.getResultCompositionMode().name(),
            concept.getExecutionScope().name(),
            concept.getPayslipOrderCode()
        );
    }

    public CreatePayrollConceptCommand toCommand(String ruleSystemCode, CreatePayrollConceptRequest req) {
        return new CreatePayrollConceptCommand(
            ruleSystemCode,
            req.conceptCode(),
            req.conceptMnemonic(),
            CalculationType.valueOf(req.calculationType()),
            FunctionalNature.valueOf(req.functionalNature()),
            ResultCompositionMode.valueOf(req.resultCompositionMode()),
            ExecutionScope.valueOf(req.executionScope()),
            req.payslipOrderCode()
        );
    }
}
```

- [ ] **Step 5: Implementar controller**

```java
@RestController
@RequestMapping("/payroll-engine/{ruleSystemCode}/concepts")
public class PayrollConceptManagementController {

    private final CreatePayrollConceptUseCase createUseCase;
    private final DeletePayrollConceptUseCase deleteUseCase;
    private final PayrollConceptRepository conceptRepository;
    private final PayrollConceptManagementAssembler assembler;

    public PayrollConceptManagementController(
        CreatePayrollConceptUseCase createUseCase,
        DeletePayrollConceptUseCase deleteUseCase,
        PayrollConceptRepository conceptRepository,
        PayrollConceptManagementAssembler assembler
    ) {
        this.createUseCase = createUseCase;
        this.deleteUseCase = deleteUseCase;
        this.conceptRepository = conceptRepository;
        this.assembler = assembler;
    }

    @GetMapping
    public List<PayrollConceptDesignerResponse> list(@PathVariable String ruleSystemCode) {
        return conceptRepository.findAllByRuleSystemCode(ruleSystemCode)
            .stream()
            .map(assembler::toResponse)
            .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PayrollConceptDesignerResponse create(
        @PathVariable String ruleSystemCode,
        @RequestBody @Valid CreatePayrollConceptRequest request
    ) {
        var concept = createUseCase.create(assembler.toCommand(ruleSystemCode, request));
        return assembler.toResponse(concept);
    }

    @DeleteMapping("/{conceptCode}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String ruleSystemCode, @PathVariable String conceptCode) {
        deleteUseCase.delete(ruleSystemCode, conceptCode);
    }
}
```

- [ ] **Step 6: Registrar `PayrollConceptAlreadyExistsException` en el exception handler global**

En `GlobalExceptionHandler.java` (o equivalente, buscar el `@RestControllerAdvice`):
```java
@ExceptionHandler(PayrollConceptAlreadyExistsException.class)
@ResponseStatus(HttpStatus.CONFLICT)
public ErrorResponse handleConceptAlreadyExists(PayrollConceptAlreadyExistsException ex) {
    return new ErrorResponse("CONCEPT_ALREADY_EXISTS", ex.getMessage());
}

@ExceptionHandler(PayrollConceptNotFoundException.class)
@ResponseStatus(HttpStatus.NOT_FOUND)
public ErrorResponse handleConceptNotFound(PayrollConceptNotFoundException ex) {
    return new ErrorResponse("CONCEPT_NOT_FOUND", ex.getMessage());
}
```

- [ ] **Step 7: Ejecutar todos los tests**

```bash
mvn test -Dtest=PayrollConceptManagementControllerTest
```
Esperado: 3 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/
git commit -m "feat(payroll-engine): add PayrollConcept CRUD controller"
```

---

### Task 5: Operand wiring, feed relations y ConceptAssignment CRUD

**Files:**
- Create: `src/main/java/com/b4rrhh/payroll_engine/concept/infrastructure/web/ConceptWiringController.java`
- Create: `src/main/java/com/b4rrhh/payroll_engine/eligibility/infrastructure/web/ConceptAssignmentManagementController.java`
- Create: tests correspondientes

- [ ] **Step 1: Añadir métodos a PayrollConceptOperandRepository y FeedRelationRepository**

En `PayrollConceptOperandRepository` (port):
```java
List<PayrollConceptOperand> findByRuleSystemCodeAndConceptCode(String ruleSystemCode, String conceptCode);
void deleteAllByRuleSystemCodeAndConceptCode(String ruleSystemCode, String conceptCode);
PayrollConceptOperand save(PayrollConceptOperand operand);
```

En `PayrollConceptFeedRelationRepository` (port):
```java
List<PayrollConceptFeedRelation> findByRuleSystemCodeAndTargetConceptCode(String ruleSystemCode, String conceptCode);
void deleteAllByRuleSystemCodeAndTargetConceptCode(String ruleSystemCode, String conceptCode);
PayrollConceptFeedRelation save(PayrollConceptFeedRelation feed);
```

Implementar en los adapters siguiendo el mismo patrón que `PayrollConceptPersistenceAdapter`.

- [ ] **Step 2: Implementar ConceptWiringController**

```java
@RestController
@RequestMapping("/payroll-engine/{ruleSystemCode}/concepts/{conceptCode}")
public class ConceptWiringController {

    private final PayrollConceptOperandRepository operandRepository;
    private final PayrollConceptFeedRelationRepository feedRepository;
    private final PayrollConceptRepository conceptRepository;
    private final PayrollObjectRepository objectRepository;

    // constructor inyección...

    @GetMapping("/operands")
    public List<ConceptOperandResponse> listOperands(
        @PathVariable String ruleSystemCode, @PathVariable String conceptCode
    ) {
        return operandRepository.findByRuleSystemCodeAndConceptCode(ruleSystemCode, conceptCode)
            .stream()
            .map(o -> new ConceptOperandResponse(o.getOperandRole().name(), o.getSourceObjectCode()))
            .toList();
    }

    @PutMapping("/operands")
    @Transactional
    public List<ConceptOperandResponse> replaceOperands(
        @PathVariable String ruleSystemCode,
        @PathVariable String conceptCode,
        @RequestBody @Valid UpdateConceptOperandsRequest request
    ) {
        operandRepository.deleteAllByRuleSystemCodeAndConceptCode(ruleSystemCode, conceptCode);
        var concept = conceptRepository.findByBusinessKey(ruleSystemCode, conceptCode)
            .orElseThrow(() -> new PayrollConceptNotFoundException(ruleSystemCode, conceptCode));
        var now = LocalDateTime.now();
        request.operands().forEach(dto -> {
            var source = objectRepository.findByBusinessKey(ruleSystemCode, dto.sourceObjectCode())
                .orElseThrow();
            var operand = new PayrollConceptOperand(
                concept.getObject(), OperandRole.valueOf(dto.operandRole()), source.getObject(), now, now
            );
            operandRepository.save(operand);
        });
        return listOperands(ruleSystemCode, conceptCode);
    }

    @GetMapping("/feeds")
    public List<ConceptFeedResponse> listFeeds(
        @PathVariable String ruleSystemCode, @PathVariable String conceptCode
    ) {
        return feedRepository.findByRuleSystemCodeAndTargetConceptCode(ruleSystemCode, conceptCode)
            .stream()
            .map(f -> new ConceptFeedResponse(
                f.getSourceObjectCode(), f.isInvertSign(), f.getEffectiveFrom(), f.getEffectiveTo()
            ))
            .toList();
    }

    @PutMapping("/feeds")
    @Transactional
    public void replaceFeeds(
        @PathVariable String ruleSystemCode,
        @PathVariable String conceptCode,
        @RequestBody @Valid UpdateConceptFeedsRequest request
    ) {
        feedRepository.deleteAllByRuleSystemCodeAndTargetConceptCode(ruleSystemCode, conceptCode);
        var target = conceptRepository.findByBusinessKey(ruleSystemCode, conceptCode)
            .orElseThrow(() -> new PayrollConceptNotFoundException(ruleSystemCode, conceptCode));
        var now = LocalDateTime.now();
        request.feeds().forEach(dto -> {
            var source = objectRepository.findByBusinessKey(ruleSystemCode, dto.sourceObjectCode())
                .orElseThrow();
            var feed = new PayrollConceptFeedRelation(
                source.getObject(), target.getObject(), FeedMode.FEED_BY_SOURCE,
                null, dto.invertSign(), dto.effectiveFrom(), dto.effectiveTo(), now, now
            );
            feedRepository.save(feed);
        });
    }
}
```

- [ ] **Step 2b: Definir DTOs de respuesta de wiring**

```java
// ConceptOperandResponse.java
public record ConceptOperandResponse(String operandRole, String sourceObjectCode) {}

// ConceptFeedResponse.java
public record ConceptFeedResponse(
    String sourceObjectCode,
    boolean invertSign,
    LocalDate effectiveFrom,
    LocalDate effectiveTo
) {}

// CreateConceptAssignmentRequest.java
public record CreateConceptAssignmentRequest(
    String conceptCode,
    String companyCode,
    String agreementCode,
    String employeeTypeCode,
    LocalDate validFrom,
    LocalDate validTo,
    int priority
) {}

// ConceptAssignmentResponse.java
public record ConceptAssignmentResponse(
    Long id,
    String ruleSystemCode,
    String conceptCode,
    String companyCode,
    String agreementCode,
    String employeeTypeCode,
    LocalDate validFrom,
    LocalDate validTo,
    int priority
) {}
```

- [ ] **Step 3: Implementar ConceptAssignmentManagementController**

```java
@RestController
@RequestMapping("/payroll-engine/{ruleSystemCode}/assignments")
public class ConceptAssignmentManagementController {

    private final ConceptAssignmentRepository repository;

    public ConceptAssignmentManagementController(ConceptAssignmentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ConceptAssignmentResponse> list(
        @PathVariable String ruleSystemCode,
        @RequestParam(required = false) String conceptCode
    ) {
        var assignments = conceptCode != null
            ? repository.findAllByRuleSystemCodeAndConceptCode(ruleSystemCode, conceptCode)
            : repository.findAllByRuleSystemCode(ruleSystemCode);
        return assignments.stream().map(this::toResponse).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConceptAssignmentResponse create(
        @PathVariable String ruleSystemCode,
        @RequestBody @Valid CreateConceptAssignmentRequest request
    ) {
        var now = LocalDateTime.now();
        var assignment = new ConceptAssignment(
            null, ruleSystemCode, request.conceptCode(),
            request.companyCode(), request.agreementCode(), request.employeeTypeCode(),
            request.validFrom(), request.validTo(), request.priority(), now, now
        );
        return toResponse(repository.save(assignment));
    }

    @DeleteMapping("/{assignmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String ruleSystemCode, @PathVariable Long assignmentId) {
        repository.deleteById(assignmentId);
    }

    private ConceptAssignmentResponse toResponse(ConceptAssignment a) {
        return new ConceptAssignmentResponse(
            a.getId(), a.getRuleSystemCode(), a.getConceptCode(),
            a.getCompanyCode(), a.getAgreementCode(), a.getEmployeeTypeCode(),
            a.getValidFrom(), a.getValidTo(), a.getPriority()
        );
    }
}
```

- [ ] **Step 4: Escribir tests de integración (equivalentes al Task 4)**

```java
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ConceptAssignmentManagementControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "ADMIN")
    void listAssignments_returnsExistingForES() throws Exception {
        mockMvc.perform(get("/payroll-engine/ES/assignments"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", not(empty())));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createAssignment_returns201() throws Exception {
        var req = Map.of(
            "conceptCode", "101",
            "validFrom", "2026-01-01",
            "priority", 10
        );
        mockMvc.perform(post("/payroll-engine/ES/assignments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.conceptCode").value("101"));
    }
}
```

- [ ] **Step 5: Ejecutar tests de backend completos**

```bash
mvn test
```
Esperado: todos los tests pasan (incluidos los existentes).

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat(payroll-engine): add wiring and assignment management controllers"
```

---

## Phase 2 — Frontend: Scaffold de b4rrhh_designer

### Task 6: Crear el proyecto React

**Files:**
- New repo: `b4rrhh_designer/` (directorio hermano de `b4rrhh_backend`)

- [ ] **Step 1: Crear el proyecto con Vite**

```bash
cd /path/to/B4RRHH   # directorio padre que contiene b4rrhh_backend y b4rrhh_frontend
npm create vite@latest b4rrhh_designer -- --template react-ts
cd b4rrhh_designer
npm install
```

- [ ] **Step 2: Instalar dependencias**

```bash
npm install @xyflow/react @tanstack/react-query zustand
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configurar Tailwind**

En `vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

En `src/index.css`:
```css
@import "tailwindcss";
```

- [ ] **Step 4: Instalar shadcn/ui**

```bash
npx shadcn@latest init
# Opciones: style=default, base color=slate, CSS variables=yes
npx shadcn@latest add button input label select drawer badge tooltip
```

- [ ] **Step 5: Inicializar git e instalar openapi-typescript**

```bash
git init
echo "node_modules\ndist\n.env" > .gitignore
npm install -D openapi-typescript
```

- [ ] **Step 6: Generar tipos desde el OpenAPI del backend**

Crear `src/api/schema.d.ts` generado desde el spec:
```bash
npx openapi-typescript http://localhost:8080/v3/api-docs -o src/api/schema.d.ts
# (requiere backend arrancado) — o apuntar al yaml:
npx openapi-typescript ../b4rrhh_backend/openapi/personnel-administration-api.yaml -o src/api/schema.d.ts
```

Crear `src/api/client.ts`:
```ts
const BASE_URL = '/api'

function getToken(): string {
  return localStorage.getItem('jwt_token') ?? ''
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  if (res.status === 204) return undefined as T
  return res.json()
}
```

- [ ] **Step 7: Commit inicial**

```bash
git add .
git commit -m "chore: scaffold b4rrhh_designer with Vite, React, Tailwind, shadcn/ui, React Flow"
```

---

### Task 7: App shell — layout, nav lateral, routing

**Files:**
- Create: `src/app/layout/AppShell.tsx`
- Create: `src/app/layout/NavSidebar.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Instalar React Router**

```bash
npm install react-router-dom
```

- [ ] **Step 2: Implementar `NavSidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom'
import { Network, List, ClipboardList, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/canvas', icon: Network, label: 'Canvas' },
  { to: '/objects', icon: List, label: 'Objetos' },
  { to: '/assignments', icon: ClipboardList, label: 'Asignaciones' },
]

export function NavSidebar() {
  return (
    <nav className="w-11 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="text-sky-400 text-lg font-bold mb-3">⬡</div>
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors ${isActive ? 'bg-sky-950 text-sky-400' : ''}`
          }
        >
          <Icon size={16} />
        </NavLink>
      ))}
      <div className="flex-1" />
      <NavLink to="/settings" title="Ajustes" className="w-8 h-8 rounded-md flex items-center justify-center text-slate-600 hover:text-slate-400">
        <Settings size={16} />
      </NavLink>
    </nav>
  )
}
```

- [ ] **Step 3: Implementar `AppShell.tsx`**

```tsx
import { Outlet } from 'react-router-dom'
import { NavSidebar } from './NavSidebar'

export function AppShell() {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <NavSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Configurar routing en `main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './app/layout/AppShell'
import { CanvasPage } from './app/canvas/CanvasPage'
import { ObjectsPage } from './app/objects/ObjectsPage'
import { AssignmentsPage } from './app/assignments/AssignmentsPage'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/canvas" replace />} />
            <Route path="canvas" element={<CanvasPage />} />
            <Route path="objects" element={<ObjectsPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
```

Crear stubs vacíos para las 3 páginas:
```tsx
// src/app/canvas/CanvasPage.tsx
export function CanvasPage() { return <div className="p-6 text-slate-500">Canvas — próximamente</div> }

// src/app/objects/ObjectsPage.tsx
export function ObjectsPage() { return <div className="p-6 text-slate-500">Objetos — próximamente</div> }

// src/app/assignments/AssignmentsPage.tsx
export function AssignmentsPage() { return <div className="p-6 text-slate-500">Asignaciones — próximamente</div> }
```

- [ ] **Step 5: Verificar que la app arranca y la nav funciona**

```bash
npm run dev
# Abrir http://localhost:5173
# Verificar: nav lateral visible, click en Canvas/Objetos/Asignaciones cambia la URL
```

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add app shell with icon sidebar and routing"
```

---

## Phase 3 — Frontend: Canvas de conceptos

### Task 8: Custom nodes de React Flow

**Files:**
- Create: `src/app/canvas/nodes/ConceptNode.tsx`
- Create: `src/app/canvas/nodes/ConceptNode.test.tsx`
- Create: `src/app/canvas/types.ts`

- [ ] **Step 1: Instalar lucide-react si no está**

```bash
npm install lucide-react
```

- [ ] **Step 2: Definir tipos del canvas**

`src/app/canvas/types.ts`:
```ts
import type { Node, Edge } from '@xyflow/react'

export type CalculationType = 'DIRECT_AMOUNT' | 'RATE_BY_QUANTITY' | 'PERCENTAGE' | 'AGGREGATE' | 'JAVA_PROVIDED'
export type FunctionalNature = 'EARNING' | 'DEDUCTION' | 'BASE' | 'INFORMATIONAL' | 'TECHNICAL' | 'TOTAL_EARNING' | 'TOTAL_DEDUCTION' | 'NET_PAY'
export type ResultCompositionMode = 'REPLACE' | 'ACCUMULATE'
export type ExecutionScope = 'SEGMENT' | 'PERIOD'

export interface ConceptNodeData {
  conceptCode: string
  conceptMnemonic: string
  calculationType: CalculationType
  functionalNature: FunctionalNature
  isDirty?: boolean
}

export type ConceptFlowNode = Node<ConceptNodeData, 'concept'>
export type ConceptFlowEdge = Edge<{ operandRole?: string; invertSign?: boolean }>

// Ports per calculation type
export const INPUT_PORTS: Record<CalculationType, string[]> = {
  DIRECT_AMOUNT: [],
  JAVA_PROVIDED: [],
  RATE_BY_QUANTITY: ['qty', 'rate'],
  PERCENTAGE: ['base', 'pct'],
  AGGREGATE: ['feed'],
}

export const PORT_COLORS: Record<string, string> = {
  qty:  'border-sky-400 bg-sky-950',
  rate: 'border-amber-400 bg-amber-950',
  base: 'border-violet-400 bg-violet-950',
  pct:  'border-pink-400 bg-pink-950',
  feed: 'border-green-400 bg-green-950',
  out:  'border-slate-400 bg-slate-700',
}

export const TYPE_BADGE_COLORS: Record<CalculationType, string> = {
  DIRECT_AMOUNT:    'bg-slate-800 text-slate-400',
  JAVA_PROVIDED:    'bg-slate-800 text-slate-400',
  RATE_BY_QUANTITY: 'bg-sky-950 text-sky-400',
  PERCENTAGE:       'bg-violet-950 text-violet-400',
  AGGREGATE:        'bg-green-950 text-green-400',
}
```

- [ ] **Step 3: Escribir test del nodo (failing)**

`src/app/canvas/nodes/ConceptNode.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { ConceptNode } from './ConceptNode'

const wrapInProvider = (ui: React.ReactElement) => (
  <ReactFlowProvider>{ui}</ReactFlowProvider>
)

describe('ConceptNode', () => {
  it('muestra código y mnemónico', () => {
    render(wrapInProvider(
      <ConceptNode
        id="101"
        data={{ conceptCode: '101', conceptMnemonic: 'SALARIO_BASE', calculationType: 'RATE_BY_QUANTITY', functionalNature: 'EARNING' }}
        selected={false}
        type="concept"
        dragging={false}
        zIndex={0}
        isConnectable={true}
        positionAbsoluteX={0}
        positionAbsoluteY={0}
      />
    ))
    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByText('SALARIO_BASE')).toBeInTheDocument()
  })

  it('muestra puertos qty y rate para RATE_BY_QUANTITY', () => {
    render(wrapInProvider(
      <ConceptNode
        id="101"
        data={{ conceptCode: '101', conceptMnemonic: 'SB', calculationType: 'RATE_BY_QUANTITY', functionalNature: 'EARNING' }}
        selected={false} type="concept" dragging={false} zIndex={0} isConnectable={true}
        positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(screen.getByTitle('qty')).toBeInTheDocument()
    expect(screen.getByTitle('rate')).toBeInTheDocument()
  })

  it('no muestra puertos de entrada para JAVA_PROVIDED', () => {
    render(wrapInProvider(
      <ConceptNode
        id="d01"
        data={{ conceptCode: 'D01', conceptMnemonic: 'DIAS', calculationType: 'JAVA_PROVIDED', functionalNature: 'TECHNICAL' }}
        selected={false} type="concept" dragging={false} zIndex={0} isConnectable={true}
        positionAbsoluteX={0} positionAbsoluteY={0}
      />
    ))
    expect(screen.queryByTitle('qty')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Ejecutar test — verificar FAIL**

```bash
npm run test -- --run ConceptNode
```

- [ ] **Step 5: Implementar `ConceptNode.tsx`**

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { type ConceptNodeData, INPUT_PORTS, PORT_COLORS, TYPE_BADGE_COLORS } from '../types'

export function ConceptNode({ data, selected }: NodeProps<ConceptNodeData>) {
  const inputPorts = INPUT_PORTS[data.calculationType]
  const isMultiPort = data.calculationType === 'AGGREGATE'

  return (
    <div className={`
      min-w-[120px] rounded-lg border bg-slate-900 text-xs
      ${selected ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-slate-700'}
      ${data.isDirty ? 'border-dashed' : ''}
    `}>
      {/* Header */}
      <div className="px-2 py-1 rounded-t-lg bg-slate-800/60 flex items-center gap-1">
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${TYPE_BADGE_COLORS[data.calculationType]}`}>
          {data.calculationType === 'RATE_BY_QUANTITY' ? 'RATE×QTY' : data.calculationType.replace('_', ' ')}
        </span>
      </div>

      {/* Body */}
      <div className="px-2 pb-2 pt-1">
        <div className="font-bold text-sm text-slate-100">{data.conceptCode}</div>
        <div className="text-slate-500 text-[9px]">{data.conceptMnemonic}</div>

        {/* Input ports */}
        {inputPorts.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-1">
            {inputPorts.map((port, i) => (
              <div key={port} className="flex items-center gap-1 relative">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={isMultiPort ? `${port}-${i}` : port}
                  title={port}
                  className={`!w-2.5 !h-2.5 !border-2 !-left-3 ${PORT_COLORS[port]}`}
                  style={{ top: 'auto', transform: 'none' }}
                />
                <span className={`text-[9px] font-medium ml-1 ${PORT_COLORS[port].split(' ')[0].replace('border', 'text')}`}>{port}</span>
              </div>
            ))}
          </div>
        )}

        {/* Output port */}
        <div className="flex justify-end mt-1">
          <Handle
            type="source"
            position={Position.Right}
            id="out"
            title="out"
            className={`!w-2.5 !h-2.5 !border-2 !-right-3 ${PORT_COLORS['out']}`}
            style={{ top: 'auto', transform: 'none' }}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Ejecutar test — verificar PASS**

```bash
npm run test -- --run ConceptNode
```

- [ ] **Step 7: Commit**

```bash
git add src/app/canvas/
git commit -m "feat(canvas): add ConceptNode component with typed ports"
```

---

### Task 9: Canvas principal — cargar conceptos y renderizar grafo

**Files:**
- Create: `src/app/canvas/api/conceptsApi.ts`
- Create: `src/app/canvas/useConceptsQuery.ts`
- Create: `src/app/canvas/CanvasPage.tsx` (reemplaza el stub)

- [ ] **Step 1: Implementar `conceptsApi.ts`**

```ts
import { apiFetch } from '../../api/client'

export interface ConceptDto {
  ruleSystemCode: string
  conceptCode: string
  conceptMnemonic: string
  calculationType: string
  functionalNature: string
  resultCompositionMode: string
  executionScope: string
  payslipOrderCode: string | null
}

export interface OperandDto { operandRole: string; sourceObjectCode: string }
export interface FeedDto { sourceObjectCode: string; invertSign: boolean; effectiveFrom: string; effectiveTo: string | null }

export const conceptsApi = {
  listConcepts: (ruleSystemCode: string) =>
    apiFetch<ConceptDto[]>(`/payroll-engine/${ruleSystemCode}/concepts`),

  listOperands: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<OperandDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/operands`),

  listFeeds: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<FeedDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/feeds`),

  createConcept: (ruleSystemCode: string, body: Omit<ConceptDto, 'ruleSystemCode'>) =>
    apiFetch<ConceptDto>(`/payroll-engine/${ruleSystemCode}/concepts`, {
      method: 'POST', body: JSON.stringify(body),
    }),

  deleteConcept: (ruleSystemCode: string, conceptCode: string) =>
    apiFetch<void>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}`, { method: 'DELETE' }),

  replaceOperands: (ruleSystemCode: string, conceptCode: string, operands: OperandDto[]) =>
    apiFetch<OperandDto[]>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/operands`, {
      method: 'PUT', body: JSON.stringify({ operands }),
    }),

  replaceFeeds: (ruleSystemCode: string, conceptCode: string, feeds: FeedDto[]) =>
    apiFetch<void>(`/payroll-engine/${ruleSystemCode}/concepts/${conceptCode}/feeds`, {
      method: 'PUT', body: JSON.stringify({ feeds }),
    }),
}
```

- [ ] **Step 2: Implementar `useConceptsQuery.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

const GRID_COLS = 4
const NODE_WIDTH = 160
const NODE_HEIGHT = 120

export function useConceptGraph(ruleSystemCode: string) {
  return useQuery({
    queryKey: ['concepts', ruleSystemCode],
    queryFn: async () => {
      const concepts = await conceptsApi.listConcepts(ruleSystemCode)
      const allOperands = await Promise.all(
        concepts.map(c => conceptsApi.listOperands(ruleSystemCode, c.conceptCode))
      )
      const allFeeds = await Promise.all(
        concepts.map(c => conceptsApi.listFeeds(ruleSystemCode, c.conceptCode))
      )

      const nodes: ConceptFlowNode[] = concepts.map((c, i) => ({
        id: c.conceptCode,
        type: 'concept' as const,
        position: { x: (i % GRID_COLS) * (NODE_WIDTH + 40), y: Math.floor(i / GRID_COLS) * (NODE_HEIGHT + 40) },
        data: {
          conceptCode: c.conceptCode,
          conceptMnemonic: c.conceptMnemonic,
          calculationType: c.calculationType as any,
          functionalNature: c.functionalNature as any,
        },
      }))

      const edges: ConceptFlowEdge[] = []
      concepts.forEach((c, i) => {
        allOperands[i].forEach(op => {
          edges.push({
            id: `op-${op.sourceObjectCode}-${c.conceptCode}-${op.operandRole}`,
            source: op.sourceObjectCode,
            target: c.conceptCode,
            targetHandle: op.operandRole.toLowerCase(),
            data: { operandRole: op.operandRole },
          })
        })
        allFeeds[i].forEach(feed => {
          edges.push({
            id: `feed-${feed.sourceObjectCode}-${c.conceptCode}`,
            source: feed.sourceObjectCode,
            target: c.conceptCode,
            targetHandle: 'feed',
            style: feed.invertSign ? { stroke: '#f87171' } : { stroke: '#4ade80' },
            data: { invertSign: feed.invertSign },
          })
        })
      })

      return { nodes, edges }
    },
  })
}
```

- [ ] **Step 3: Implementar `CanvasPage.tsx`**

```tsx
import { useCallback, useState } from 'react'
import { ReactFlow, Background, MiniMap, Controls, addEdge, useNodesState, useEdgesState, type Connection } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ConceptNode } from './nodes/ConceptNode'
import { useConceptGraph } from './useConceptsQuery'
import type { ConceptFlowNode, ConceptFlowEdge } from './types'

const nodeTypes = { concept: ConceptNode }
const RULE_SYSTEM = 'ES' // TODO: hacer configurable desde selector en toolbar

export function CanvasPage() {
  const { data, isLoading } = useConceptGraph(RULE_SYSTEM)
  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptFlowNode>(data?.nodes ?? [])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ConceptFlowEdge>(data?.edges ?? [])
  const [selectedNode, setSelectedNode] = useState<ConceptFlowNode | null>(null)

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, id: `e-${params.source}-${params.target}-${params.targetHandle}` }, eds)),
    [setEdges]
  )

  if (isLoading) return <div className="flex items-center justify-center h-full text-slate-500">Cargando grafo...</div>

  return (
    <div className="flex h-full">
      {/* Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node as ConceptFlowNode)}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Background color="#1e293b" gap={22} size={1} />
          <MiniMap className="!bg-slate-900" nodeColor="#334155" />
          <Controls className="!bg-slate-900 !border-slate-700" />
        </ReactFlow>
      </div>

      {/* Right panel */}
      {selectedNode && (
        <aside className="w-52 bg-slate-900 border-l border-slate-800 p-3 text-xs overflow-y-auto flex-shrink-0">
          <div className="font-bold text-sky-400 mb-1">{selectedNode.data.conceptCode} · {selectedNode.data.conceptMnemonic}</div>
          <div className="text-slate-500 text-[9px] mb-3">PayrollConcept</div>
          <div className="space-y-2">
            <Field label="Tipo" value={selectedNode.data.calculationType} />
            <Field label="Naturaleza" value={selectedNode.data.functionalNature} />
          </div>
        </aside>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-600 text-[9px] uppercase tracking-wide mb-0.5">{label}</div>
      <div className="bg-slate-950 text-slate-300 px-1.5 py-0.5 rounded text-[10px]">{value}</div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar en browser (con backend arrancado)**

```bash
# Terminal 1 — backend
cd b4rrhh_backend && mvn spring-boot:run

# Terminal 2 — designer
cd b4rrhh_designer && npm run dev
```
Abrir http://localhost:5173 → verificar que el canvas muestra los conceptos del seed con conexiones.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(canvas): load and render concept graph from API"
```

---

### Task 10: Crear concepto — drawer form + save wiring

**Files:**
- Create: `src/app/canvas/CreateConceptDrawer.tsx`
- Modify: `src/app/canvas/CanvasPage.tsx`

- [ ] **Step 1: Implementar `CreateConceptDrawer.tsx`**

```tsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { conceptsApi } from './api/conceptsApi'

interface Props { open: boolean; onClose: () => void; ruleSystemCode: string }

export function CreateConceptDrawer({ open, onClose, ruleSystemCode }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    conceptCode: '', conceptMnemonic: '',
    calculationType: 'RATE_BY_QUANTITY',
    functionalNature: 'EARNING',
    resultCompositionMode: 'ACCUMULATE',
    executionScope: 'SEGMENT',
    payslipOrderCode: '',
  })

  const mutation = useMutation({
    mutationFn: () => conceptsApi.createConcept(ruleSystemCode, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] })
      onClose()
    },
  })

  return (
    <Drawer open={open} onClose={onClose} direction="right">
      <DrawerContent className="bg-slate-900 border-slate-800 h-full w-80 ml-auto mt-0 rounded-none">
        <DrawerHeader>
          <DrawerTitle className="text-slate-200">Nuevo concepto</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 space-y-3 text-sm">
          <div>
            <Label className="text-slate-400">Código</Label>
            <Input className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.conceptCode} onChange={e => setForm(f => ({ ...f, conceptCode: e.target.value }))} />
          </div>
          <div>
            <Label className="text-slate-400">Mnemónico</Label>
            <Input className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.conceptMnemonic} onChange={e => setForm(f => ({ ...f, conceptMnemonic: e.target.value }))} />
          </div>
          <div>
            <Label className="text-slate-400">Tipo de cálculo</Label>
            <Select value={form.calculationType} onValueChange={v => setForm(f => ({ ...f, calculationType: v }))}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {['DIRECT_AMOUNT','RATE_BY_QUANTITY','PERCENTAGE','AGGREGATE','JAVA_PROVIDED'].map(t => (
                  <SelectItem key={t} value={t} className="text-slate-200">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400">Naturaleza funcional</Label>
            <Select value={form.functionalNature} onValueChange={v => setForm(f => ({ ...f, functionalNature: v }))}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {['EARNING','DEDUCTION','BASE','INFORMATIONAL','TECHNICAL','TOTAL_EARNING','TOTAL_DEDUCTION','NET_PAY'].map(n => (
                  <SelectItem key={n} value={n} className="text-slate-200">{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400">Ámbito</Label>
            <Select value={form.executionScope} onValueChange={v => setForm(f => ({ ...f, executionScope: v }))}>
              <SelectTrigger className="bg-slate-950 border-slate-700 text-slate-200 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="SEGMENT" className="text-slate-200">SEGMENT</SelectItem>
                <SelectItem value="PERIOD" className="text-slate-200">PERIOD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-slate-400">Orden nómina (opcional)</Label>
            <Input className="bg-slate-950 border-slate-700 text-slate-200 mt-1"
              value={form.payslipOrderCode} onChange={e => setForm(f => ({ ...f, payslipOrderCode: e.target.value }))} />
          </div>
          {mutation.isError && (
            <div className="text-red-400 text-xs">Error al crear concepto</div>
          )}
        </div>
        <DrawerFooter className="mt-auto">
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !form.conceptCode || !form.conceptMnemonic}
            className="w-full bg-sky-600 hover:bg-sky-500">
            {mutation.isPending ? 'Creando...' : 'Crear concepto'}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full border-slate-700 text-slate-300">Cancelar</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
```

- [ ] **Step 2: Integrar el drawer y el botón "+ Concepto" en `CanvasPage.tsx`**

Añadir al `CanvasPage`:
```tsx
// Añadir estado y drawer
const [drawerOpen, setDrawerOpen] = useState(false)

// Añadir toolbar encima del ReactFlow
<div className="absolute top-2 right-2 z-10 flex gap-2">
  <button onClick={() => setDrawerOpen(true)}
    className="text-xs px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md hover:bg-slate-700">
    + Concepto
  </button>
</div>
<CreateConceptDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} ruleSystemCode={RULE_SYSTEM} />
```

- [ ] **Step 3: Verificar end-to-end**

Con backend arrancado:
1. Abrir http://localhost:5173
2. Click "+ Concepto"
3. Rellenar código "201", mnemónico "PLUS_TRANSPORTE", tipo RATE_BY_QUANTITY
4. Verificar que el nodo aparece en el canvas
5. Verificar en BD: `select * from payroll_engine.payroll_concept where object_code = '201'`

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(canvas): add concept creation drawer"
```

---

### Task 11: Guardar wiring al backend

**Files:**
- Create: `src/app/canvas/useSaveGraph.ts`
- Modify: `src/app/canvas/CanvasPage.tsx`

- [ ] **Step 1: Implementar `useSaveGraph.ts`**

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { conceptsApi } from './api/conceptsApi'
import type { ConceptFlowNode, ConceptFlowEdge, CalculationType } from './types'
import { INPUT_PORTS } from './types'

export function useSaveGraph(ruleSystemCode: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ nodes, edges }: { nodes: ConceptFlowNode[]; edges: ConceptFlowEdge[] }) => {
      await Promise.all(nodes.map(async node => {
        const calcType = node.data.calculationType as CalculationType
        const requiredPorts = INPUT_PORTS[calcType]

        if (calcType === 'AGGREGATE') {
          // Feed relations
          const feeds = edges
            .filter(e => e.target === node.id && e.targetHandle === 'feed')
            .map(e => ({
              sourceObjectCode: e.source,
              invertSign: e.data?.invertSign ?? false,
              effectiveFrom: '2020-01-01',
              effectiveTo: null,
            }))
          await conceptsApi.replaceFeeds(ruleSystemCode, node.id, feeds)
        } else if (requiredPorts.length > 0) {
          // Operands
          const operands = edges
            .filter(e => e.target === node.id)
            .map(e => ({
              operandRole: (e.targetHandle ?? '').toUpperCase(),
              sourceObjectCode: e.source,
            }))
            .filter(o => o.operandRole)
          await conceptsApi.replaceOperands(ruleSystemCode, node.id, operands)
        }
      }))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] }),
  })
}
```

- [ ] **Step 2: Añadir botón "Guardar" en `CanvasPage.tsx`**

```tsx
const saveGraph = useSaveGraph(RULE_SYSTEM)

// En la toolbar:
<button
  onClick={() => saveGraph.mutate({ nodes, edges })}
  disabled={saveGraph.isPending}
  className="text-xs px-3 py-1.5 bg-green-900 border border-green-700 text-green-300 rounded-md hover:bg-green-800 disabled:opacity-50"
>
  {saveGraph.isPending ? 'Guardando...' : '↑ Guardar'}
</button>
```

- [ ] **Step 3: Verificar end-to-end**

1. Crear concepto 201 (RATE_BY_QUANTITY)
2. Conectar D01 → puerto `qty` de 201
3. Conectar P01 → puerto `rate` de 201
4. Click "Guardar"
5. Verificar en BD: `select * from payroll_engine.concept_operand where target_object_id = (select object_id from payroll_engine.payroll_concept where concept_mnemonic = 'PLUS_TRANSPORTE')`

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(canvas): save operand and feed wiring to backend"
```

---

## Phase 4 — Frontend: Objetos y Asignaciones

### Task 12: Módulo Objetos (tablas y constantes)

**Files:**
- Create: `src/app/objects/ObjectsPage.tsx` (reemplaza stub)
- Create: `src/app/objects/api/objectsApi.ts`

- [ ] **Step 1: Implementar API client de objetos**

```ts
// src/app/objects/api/objectsApi.ts
import { apiFetch } from '../../api/client'

export interface PayrollObjectDto {
  ruleSystemCode: string
  objectCode: string
  objectTypeCode: 'TABLE' | 'CONSTANT'
  displayOrder: number | null
  active: boolean
}

export const objectsApi = {
  list: (ruleSystemCode: string, type: 'TABLE' | 'CONSTANT') =>
    apiFetch<PayrollObjectDto[]>(`/payroll-engine/${ruleSystemCode}/objects?type=${type}`),
}
```

- [ ] **Step 2: Implementar `ObjectsPage.tsx`**

```tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { objectsApi } from './api/objectsApi'

const RULE_SYSTEM = 'ES'
type Tab = 'CONSTANT' | 'TABLE'

export function ObjectsPage() {
  const [tab, setTab] = useState<Tab>('CONSTANT')
  const { data = [], isLoading } = useQuery({
    queryKey: ['objects', RULE_SYSTEM, tab],
    queryFn: () => objectsApi.list(RULE_SYSTEM, tab),
  })

  return (
    <div className="p-4">
      <h1 className="text-slate-200 font-semibold mb-4">Objetos de soporte</h1>
      <div className="flex gap-2 mb-4">
        {(['CONSTANT', 'TABLE'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${tab === t ? 'bg-sky-950 border-sky-700 text-sky-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'}`}>
            {t === 'CONSTANT' ? 'Constantes' : 'Tablas'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-sm">Cargando...</div>
      ) : (
        <table className="w-full text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-800">
              <th className="pb-2 pr-4">Código</th>
              <th className="pb-2 pr-4">Tipo</th>
              <th className="pb-2 pr-4">Activo</th>
            </tr>
          </thead>
          <tbody>
            {data.map(obj => (
              <tr key={obj.objectCode} className="border-b border-slate-900 hover:bg-slate-900/50">
                <td className="py-2 pr-4 font-mono">{obj.objectCode}</td>
                <td className="py-2 pr-4 text-slate-500">{obj.objectTypeCode}</td>
                <td className="py-2 pr-4">
                  <span className={obj.active ? 'text-green-400' : 'text-slate-600'}>
                    {obj.active ? '✓' : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar en browser**

Navegar a http://localhost:5173/objects — verificar que lista las constantes y tablas del seed.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat(objects): add objects listing page for tables and constants"
```

---

### Task 13: Módulo Asignaciones

**Files:**
- Create: `src/app/assignments/AssignmentsPage.tsx` (reemplaza stub)
- Create: `src/app/assignments/api/assignmentsApi.ts`
- Create: `src/app/assignments/CreateAssignmentDialog.tsx`

- [ ] **Step 1: Implementar API y página de asignaciones**

```ts
// src/app/assignments/api/assignmentsApi.ts
import { apiFetch } from '../../api/client'

export interface AssignmentDto {
  id: number
  ruleSystemCode: string
  conceptCode: string
  companyCode: string | null
  agreementCode: string | null
  employeeTypeCode: string | null
  validFrom: string
  validTo: string | null
  priority: number
}

export const assignmentsApi = {
  list: (ruleSystemCode: string, conceptCode?: string) => {
    const qs = conceptCode ? `?conceptCode=${conceptCode}` : ''
    return apiFetch<AssignmentDto[]>(`/payroll-engine/${ruleSystemCode}/assignments${qs}`)
  },
  create: (ruleSystemCode: string, body: Omit<AssignmentDto, 'id' | 'ruleSystemCode'>) =>
    apiFetch<AssignmentDto>(`/payroll-engine/${ruleSystemCode}/assignments`, {
      method: 'POST', body: JSON.stringify(body),
    }),
  delete: (ruleSystemCode: string, id: number) =>
    apiFetch<void>(`/payroll-engine/${ruleSystemCode}/assignments/${id}`, { method: 'DELETE' }),
}
```

```tsx
// src/app/assignments/AssignmentsPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi } from './api/assignmentsApi'

const RULE_SYSTEM = 'ES'

export function AssignmentsPage() {
  const qc = useQueryClient()
  const { data = [], isLoading } = useQuery({
    queryKey: ['assignments', RULE_SYSTEM],
    queryFn: () => assignmentsApi.list(RULE_SYSTEM),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => assignmentsApi.delete(RULE_SYSTEM, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments', RULE_SYSTEM] }),
  })

  return (
    <div className="p-4">
      <h1 className="text-slate-200 font-semibold mb-4">Reglas de asignación</h1>
      {isLoading ? (
        <div className="text-slate-500 text-sm">Cargando...</div>
      ) : (
        <table className="w-full text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="text-slate-500 text-left border-b border-slate-800">
              <th className="pb-2 pr-3">Concepto</th>
              <th className="pb-2 pr-3">Empresa</th>
              <th className="pb-2 pr-3">Convenio</th>
              <th className="pb-2 pr-3">Tipo emp.</th>
              <th className="pb-2 pr-3">Desde</th>
              <th className="pb-2 pr-3">Prioridad</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.map(a => (
              <tr key={a.id} className="border-b border-slate-900 hover:bg-slate-900/50">
                <td className="py-1.5 pr-3 font-mono text-sky-400">{a.conceptCode}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.companyCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.agreementCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-500">{a.employeeTypeCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-slate-400">{a.validFrom}</td>
                <td className="py-1.5 pr-3 text-slate-400">{a.priority}</td>
                <td className="py-1.5">
                  <button onClick={() => deleteMutation.mutate(a.id)}
                    className="text-red-500 hover:text-red-400 text-[10px]">⊗</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar en browser**

Navegar a http://localhost:5173/assignments — verificar que lista las asignaciones del seed.

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat(assignments): add assignments listing and delete"
```

---

## Verificación end-to-end

Al finalizar todas las tareas, verificar el flujo completo:

- [ ] 1. Abrir Payroll Designer en http://localhost:5173
- [ ] 2. En Canvas: el grafo muestra los conceptos existentes (101, D01, P01, 700, 800, 970, 980, 990) con sus conexiones correctas
- [ ] 3. Crear concepto 201 (PLUS_TRANSPORTE, RATE_BY_QUANTITY, EARNING)
- [ ] 4. Conectar D01 → `qty` de 201, P01 → `rate` de 201
- [ ] 5. Click "Guardar" — verificar OK
- [ ] 6. En Asignaciones: crear una regla para concepto 201, ES, wildcard, desde 2026-01-01, prioridad 5
- [ ] 7. Lanzar cálculo de nómina desde b4rrhh_frontend para un empleado — verificar que el concepto 201 aparece en el resultado
- [ ] 8. En Objetos: verificar que listan las constantes del seed (tipo SS, porcentaje IRPF)
