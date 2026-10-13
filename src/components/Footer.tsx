export default function Footer() {
  return (
    <footer className="asc-copyright">
      <div>
        <div className="copyright-box">
          <div className="copyright-item">
            <div className="copyright-item-title">About Packbang</div>
            <div className="copyright-item-link">
              <a href="#" className="copyright-item-link-a">About Packbang</a>
              <a href="#" className="copyright-item-link-a">Packaging Standards</a>
              <a href="#" className="copyright-item-link-a">Factory Network</a>
              <a href="#" className="copyright-item-link-a">Privacy Policy</a>
            </div>
          </div>

          <div className="copyright-item">
            <div className="copyright-item-title">Packaging Categories</div>
            <div className="copyright-item-link">
              <a href="#" className="copyright-item-link-a">Courier Poly Mailers</a>
              <a href="#" className="copyright-item-link-a">Bubble Wrap & Cushioning</a>
              <a href="#" className="copyright-item-link-a">Corrugated Carton Boxes</a>
              <a href="#" className="copyright-item-link-a">Gift Packets & Shopping Bags</a>
              <a href="#" className="copyright-item-link-a">Branded Stickers & Tape</a>
            </div>
          </div>

          <div className="copyright-item">
            <div className="copyright-item-title">Seller Support</div>
            <div className="copyright-item-link">
              <a href="#" className="copyright-item-link-a">Packbang Academy</a>
              <a href="#" className="copyright-item-link-a">Bulk Logistics & Pickup</a>
              <a href="#" className="copyright-item-link-a">Seller Guidelines</a>
              <a href="#" className="copyright-item-link-a">Contact Support</a>
            </div>
          </div>

          <div className="copyright-item copyright-item-code">
            <div className="copyright-item-title">Packbang Seller App</div>
            <div className="app-qr-row">
              <div style={{
                width: '58px',
                height: '58px',
                background: '#F85606',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '24px'
              }}>
                📦
              </div>
              <div className="app-badges">
                <span className="app-badge-text">Manage wholesale orders</span>
                <span className="app-store-label">Google Play & App Store</span>
              </div>
            </div>
          </div>
        </div>

        <div className="copyright-text">
          © Packbang 2026. All Rights Reserved. Bangladesh's Premier Packaging Supplier Platform.
        </div>
      </div>
    </footer>
  );
}
