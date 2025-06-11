;; Appraiser Verification Contract
;; Validates real estate appraisers and manages their credentials

(define-data-var admin principal tx-sender)

;; Data maps for appraiser information
(define-map appraisers principal
  {
    name: (string-utf8 100),
    license-number: (string-utf8 50),
    license-expiry: uint,
    reputation-score: uint,
    is-active: bool
  }
)

;; Public function to register a new appraiser
(define-public (register-appraiser (name (string-utf8 100)) (license-number (string-utf8 50)) (license-expiry uint))
  (let ((caller tx-sender))
    (asserts! (not (default-to false (get is-active (map-get? appraisers caller)))) (err u1)) ;; Ensure not already registered
    (ok (map-set appraisers caller {
      name: name,
      license-number: license-number,
      license-expiry: license-expiry,
      reputation-score: u0,
      is-active: true
    }))
  )
)

;; Admin function to update appraiser status
(define-public (update-appraiser-status (appraiser principal) (is-active bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can update status
    (asserts! (is-some (map-get? appraisers appraiser)) (err u404)) ;; Ensure appraiser exists
    (ok (map-set appraisers appraiser
      (merge (unwrap-panic (map-get? appraisers appraiser)) { is-active: is-active })))
  )
)

;; Public function to update reputation score
(define-public (update-reputation (appraiser principal) (score uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403)) ;; Only admin can update reputation
    (asserts! (<= score u100) (err u400)) ;; Score must be between 0 and 100
    (asserts! (is-some (map-get? appraisers appraiser)) (err u404)) ;; Ensure appraiser exists
    (ok (map-set appraisers appraiser
      (merge (unwrap-panic (map-get? appraisers appraiser)) { reputation-score: score })))
  )
)

;; Read-only function to check if an appraiser is verified
(define-read-only (is-verified-appraiser (appraiser principal))
  (let ((appraiser-data (map-get? appraisers appraiser)))
    (if (is-some appraiser-data)
      (get is-active (unwrap-panic appraiser-data))
      false
    )
  )
)

;; Read-only function to get appraiser details
(define-read-only (get-appraiser-details (appraiser principal))
  (map-get? appraisers appraiser)
)

;; Function to transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u403))
    (ok (var-set admin new-admin))
  )
)
