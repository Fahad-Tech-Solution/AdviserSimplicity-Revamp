export default function RateReferenceSection({ title, subtitle, children, footer }) {
    return (
        <section className="rate-ref-section">
            <h3>
                {title}
                {subtitle ? <span>{subtitle}</span> : null}
            </h3>
            <div className="rate-ref-table-shell">{children}</div>
            {footer}
        </section>
    );
}
