;; Valuation Methodology Contract
;; Manages property valuation methods

(define-data-var admin principal tx-sender)

;; Data map for valuation methodologies
(define-map methodologies uint
  {
    name: (string-utf8 100),
    description: (string-utf8 500),
    version: uint,
    is-active: bool
  }
)

;; Counter for methodology IDs
(define-data-var next-methodology-id uint u1)

;; Public function to add a new methodology
(define-public (add-methodology (name (string-utf8 100)) (description (string-utf8 500)))
  (let ((methodology-id (var-get next-methodology-id)))
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can add methodologies
    (map-set methodologies methodology-id {
      name: name,
      description: description,
      version: u1,
      is-active: true
    })
    (var-set next-methodology-id (+ methodology-id u1))
    (ok methodology-id)
  )
)

;; Public function to update a methodology
(define-public (update-methodology (methodology-id uint) (name (string-utf8 100)) (description (string-utf8 500)))
  (let ((methodology (map-get? methodologies methodology-id)))
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can update methodologies
    (asserts! (is-some methodology) (err u404)) ;; Ensure methodology exists
    (let ((current-methodology (unwrap-panic methodology)))
      (ok (map-set methodologies methodology-id {
        name: name,
        description: description,
        version: (+ (get version current-methodology) u1),
        is-active: (get is-active current-methodology)
      }))
    )
  )
)

;; Public function to activate/deactivate a methodology
(define-public (set-methodology-status (methodology-id uint) (is-active bool))
  (let ((methodology (map-get? methodologies methodology-id)))
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can update status
    (asserts! (is-some methodology) (err u404)) ;; Ensure methodology exists
    (ok (map-set methodologies methodology-id
      (merge (unwrap-panic methodology) { is-active: is-active })))
  )
)

;; Read-only function to get methodology details
(define-read-only (get-methodology (methodology-id uint))
  (map-get? methodologies methodology-id)
)

;; Read-only function to check if a methodology is active
(define-read-only (is-active-methodology (methodology-id uint))
  (let ((methodology (map-get? methodologies methodology-id)))
    (if (is-some methodology)
      (get is-active (unwrap-panic methodology))
      false
    )
  )
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (var-set admin new-admin))
  )
)
